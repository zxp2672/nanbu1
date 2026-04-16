const express = require('express');
const cors = require('cors');
const compression = require('compression');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'nanbu-alumni-secret-key-2024';

// 中间件 - CORS配置（支持微信浏览器）
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true, // 允许携带cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 微信浏览器兼容：添加必要的响应头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 头像上传配置
const avatarStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'avatars');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'avatar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + ext);
  }
});
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 数据库初始化
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 初始化数据库表
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        school TEXT,
        level TEXT,
        year INTEGER,
        classname TEXT,
        job TEXT,
        city TEXT,
        bio TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 校友表
    db.run(`CREATE TABLE IF NOT EXISTS alumni (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school TEXT,
        level TEXT,
        year INTEGER,
        classname TEXT,
        phone TEXT,
        job TEXT,
        company TEXT,
        city TEXT,
        bio TEXT,
        avatar TEXT,
        user_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 资源表
    db.run(`CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        contact TEXT,
        author TEXT,
        author_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )`);

    // 活动表
    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_time DATETIME,
        end_time DATETIME,
        location TEXT,
        capacity INTEGER DEFAULT 0,
        description TEXT,
        organizer_name TEXT,
        organizer_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
    )`);

    // 活动报名表
    db.run(`CREATE TABLE IF NOT EXISTS activity_signups (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT,
        avatar TEXT,
        school TEXT,
        signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_id, user_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 动态表
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        image TEXT,
        author TEXT,
        author_id TEXT,
        school TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )`);

    // 学校表
    db.run(`CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        short_name TEXT,
        icon TEXT DEFAULT '🏫',
        description TEXT,
        founded_year INTEGER,
        color TEXT DEFAULT '#1a6fc4',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('数据库表初始化完成');
    
    // 插入初始数据
    initData();
});

// 初始化数据
function initData() {
    const hash = bcrypt.hashSync('123456', 10);
    
    // 学校数据
    const schools = [
        ['s1', '南部中学', 'nb1', '🏫', '南部县重点高中，创建于1950年，历史悠久，英才辈出。', 1950, '#1a6fc4'],
        ['s2', '南部二中', 'nb2', '🏫', '南部县第二中学，办学严谨，培育了大批优秀学子。', 1962, '#7c3aed'],
        ['s3', '南部三中', 'nb3', '🏫', '南部县第三中学，注重素质教育，全面发展。', 1975, '#059669'],
        ['s4', '大桥中学', 'dq', '🏫', '大桥镇中学，扎根乡土，服务地方教育事业。', 1968, '#d97706'],
        ['s5', '东坝中学', 'db', '🏫', '东坝镇中学，勤奋务实，培养了众多优秀人才。', 1972, '#dc2626'],
        ['s6', '建兴中学', 'jx', '🏫', '建兴镇中学，艰苦奋斗，为地方发展贡献力量。', 1980, '#0891b2']
    ];

    schools.forEach(s => {
        db.run(`INSERT OR IGNORE INTO schools (id, name, short_name, icon, description, founded_year, color) VALUES (?, ?, ?, ?, ?, ?, ?)`, s);
    });

    // 真实年轻头像URL（来自Unsplash）
    const avatars = [
        // 女生头像
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
        // 男生头像
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1480429370612-2b0cf398ac8d?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face'
    ];

    // 常见姓名
    const familyNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
    const maleNames = ['伟', '强', '磊', '军', '杰', '涛', '明', '华', '亮', '鹏', '飞', '宇', '浩', '天', '然', '博', '文', '志', '建国', '志强', '文博', '浩然', '子轩', '雨泽', '梓豪'];
    const femaleNames = ['芳', '娜', '丽', '敏', '静', '秀英', '玉兰', '雪', '梅', '婷', '倩', '媛', '蕾', '欣', '怡', '梦', '瑶', '佳', '雨涵', '思颖', '诗涵', '欣怡', '梦琪', '雅婷', '若曦'];

    // 职业和公司
    const jobs = [
        {job: '软件工程师', company: '腾讯科技'},
        {job: '产品经理', company: '阿里巴巴'},
        {job: '数据分析师', company: '字节跳动'},
        {job: '设计师', company: '网易'},
        {job: '教师', company: '南部中学'},
        {job: '医生', company: '南充市中心医院'},
        {job: '公务员', company: '南部县政府'},
        {job: '创业者', company: '成都某科技公司'},
        {job: '建筑师', company: '中建集团'},
        {job: '律师', company: '北京大成律师事务所'},
        {job: '财务总监', company: '招商银行'},
        {job: '投资经理', company: '中信证券'},
        {job: '记者', company: '四川日报'},
        {job: '摄影师', company: '自由职业'},
        {job: '研究生', company: '清华大学'},
        {job: '博士生', company: '北京大学'},
        {job: '销售总监', company: '华为'},
        {job: '运维工程师', company: '京东'},
        {job: '测试工程师', company: '小米'},
        {job: 'UI设计师', company: '美团'}
    ];

    const cities = ['北京', '上海', '广州', '深圳', '成都', '重庆', '杭州', '南京', '武汉', '西安', '南充', '绵阳'];
    const levels = ['初中', '高中'];
    const classNames = ['高三(1)班', '高三(2)班', '高三(3)班', '高三(4)班', '初三(1)班', '初三(2)班', '初三(3)班'];
    const years = [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020];
    const bios = [
        '热爱技术，关注家乡发展。',
        '在外打拼，怀念母校时光。',
        '希望为家乡建设贡献力量。',
        '永远记得那段青葱岁月。',
        '感恩母校培养，期待校友聚会。',
        '努力学习，回报社会。',
        '关注家乡变化，祝福母校越来越好。',
        '同窗情谊，终生难忘。',
        '青春无悔，友谊长存。',
        '愿母校桃李满天下。'
    ];

    // 用户数据 - 包含各学校、各班级管理员
    const users = [
        // 总管理员
        ['u0', 'admin', hash, '总管理员', 'superadmin', '', '', '', '', '系统管理员', '南充', '南部县校友会联盟总管理员', ''],
        // 学校管理员
        ['u_nb1', 'nb1_admin', hash, '南部中学管理员', 'school_admin', '南部中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_nb2', 'nb2_admin', hash, '南部二中管理员', 'school_admin', '南部二中', '', '', '', '学校管理员', '南充', '', ''],
        ['u_nb3', 'nb3_admin', hash, '南部三中管理员', 'school_admin', '南部三中', '', '', '', '学校管理员', '南充', '', ''],
        ['u_dq', 'dq_admin', hash, '大桥中学管理员', 'school_admin', '大桥中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_db', 'db_admin', hash, '东坝中学管理员', 'school_admin', '东坝中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_jx', 'jx_admin', hash, '建兴中学管理员', 'school_admin', '建兴中学', '', '', '', '学校管理员', '南充', '', ''],
        // 班级管理员 - 南部中学
        ['u_nb1_2005_1', 'nb1_2005_1', hash, '南部中学2005级1班管理员', 'class_admin', '南部中学', '高中', 2005, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_nb1_2005_2', 'nb1_2005_2', hash, '南部中学2005级2班管理员', 'class_admin', '南部中学', '高中', 2005, '高三(2)班', '班级管理员', '南充', '', ''],
        ['u_nb1_2010_1', 'nb1_2010_1', hash, '南部中学2010级1班管理员', 'class_admin', '南部中学', '高中', 2010, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_nb1_2010_2', 'nb1_2010_2', hash, '南部中学2010级2班管理员', 'class_admin', '南部中学', '高中', 2010, '高三(2)班', '班级管理员', '南充', '', ''],
        // 班级管理员 - 南部二中
        ['u_nb2_2008_1', 'nb2_2008_1', hash, '南部二中2008级1班管理员', 'class_admin', '南部二中', '高中', 2008, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_nb2_2008_2', 'nb2_2008_2', hash, '南部二中2008级2班管理员', 'class_admin', '南部二中', '高中', 2008, '高三(2)班', '班级管理员', '南充', '', ''],
        // 班级管理员 - 南部三中
        ['u_nb3_2010_1', 'nb3_2010_1', hash, '南部三中2010级1班管理员', 'class_admin', '南部三中', '高中', 2010, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_nb3_2010_2', 'nb3_2010_2', hash, '南部三中2010级2班管理员', 'class_admin', '南部三中', '高中', 2010, '高三(2)班', '班级管理员', '南充', '', ''],
        // 班级管理员 - 其他学校
        ['u_dq_2009_1', 'dq_2009_1', hash, '大桥中学2009级1班管理员', 'class_admin', '大桥中学', '高中', 2009, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_db_2007_1', 'db_2007_1', hash, '东坝中学2007级1班管理员', 'class_admin', '东坝中学', '高中', 2007, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_jx_2008_1', 'jx_2008_1', hash, '建兴中学2008级1班管理员', 'class_admin', '建兴中学', '初中', 2008, '初三(1)班', '班级管理员', '南充', '', ''],
        // 普通用户
        ['u2', 'user', hash, '张同学', 'user', '南部中学', '高中', 2010, '高三(2)班', '软件工程师', '成都', '热爱编程，关注家乡发展。', ''],
        ['u3', 'li', hash, '李同学', 'user', '南部二中', '高中', 2012, '高三(3)班', '教师', '南充', '回到家乡，投身教育。', '']
    ];

    users.forEach(u => {
        db.run(`INSERT OR IGNORE INTO users (id, username, password, name, role, school, level, year, classname, job, city, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, u);
    });

    // 校友数据
    const alumni = [
        ['a1', '张伟', '南部中学', '高中', 2005, '高三(1)班', '138****0001', '高级工程师', '腾讯科技', '深圳', '专注后端开发，热爱开源。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', 'u2', 'approved'],
        ['a2', '李娜', '南部中学', '高中', 2006, '高三(2)班', '139****0002', '产品经理', '阿里巴巴', '杭州', '用户体验爱好者，关注产品设计。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina', null, 'approved'],
        ['a3', '王磊', '南部二中', '高中', 2008, '高三(1)班', '137****0003', '投资分析师', '中信证券', '北京', '专注股权投资，关注新兴产业。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglei', null, 'approved'],
        ['a4', '刘芳', '南部二中', '初中', 2005, '初三(2)班', '136****0004', '财务总监', '招商银行', '上海', '十年财务经验，CPA持证人。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang', null, 'approved'],
        ['a5', '陈强', '南部三中', '高中', 2010, '高三(3)班', '135****0005', '技术总监', '比亚迪', '深圳', '新能源汽车专家，专注智能驾驶。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang', null, 'approved'],
        ['a6', '赵敏', '大桥中学', '高中', 2009, '高三(1)班', '134****0006', '副教授', '西南大学', '重庆', '教育心理学研究，关注青少年发展。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomin', null, 'approved'],
        ['a7', '孙浩', '东坝中学', '高中', 2007, '高三(2)班', '133****0007', '主治医师', '南充市中心医院', '南充', '心血管内科专家，热爱公益医疗。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao', null, 'approved'],
        ['a8', '周婷', '建兴中学', '初中', 2008, '初三(1)班', '132****0008', '记者', '四川日报', '成都', '专注深度报道，关注社会民生。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouting', null, 'approved'],
        ['a9', '吴杰', '南部中学', '高中', 2003, '高三(4)班', '131****0009', '公务员', '南部县政府', '南充', '服务家乡建设，推动地方发展。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wujie', null, 'approved'],
        ['a10', '郑雪', '南部中学', '高中', 2004, '高三(1)班', '130****0010', 'CTO', '字节跳动', '北京', '人工智能领域专家，关注大模型应用。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengxue', null, 'approved'],
        ['a11', '黄鹏', '南部中学', '高中', 2010, '高三(1)班', '189****0011', '架构师', '华为', '深圳', '云计算与分布式系统专家。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangpeng', null, 'approved'],
        ['a12', '林晓燕', '南部中学', '高中', 2010, '高三(2)班', '188****0012', 'UI设计师', '网易', '广州', '专注用户界面设计，热爱艺术。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=linxiaoyan', null, 'approved'],
        ['a13', '马超', '南部二中', '高中', 2010, '高三(2)班', '187****0013', '律师', '北京大成律师事务所', '北京', '专注商业法律，服务企业合规。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=machao', null, 'approved'],
        ['a14', '谢雨', '南部三中', '初中', 2008, '初三(1)班', '186****0014', '数据科学家', '百度', '北京', '机器学习与数据挖掘专家。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xieyu', null, 'pending'],
        ['a15', '冯涛', '大桥中学', '高中', 2012, '高三(3)班', '185****0015', '创业者', '成都某科技公司', '成都', '连续创业者，专注农业科技。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fengtao', null, 'pending']
    ];

    alumni.forEach(a => {
        db.run(`INSERT OR IGNORE INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, a);
    });

    // 资源数据
    const resources = [
        ['r1', '成都互联网公司招聘Java工程师', 'job', '我司（成都某上市互联网公司）急招Java后端工程师3名，要求3年以上经验，熟悉Spring Boot，薪资20-35K，欢迎南部老乡投递简历。', '微信: zhangwei_job', '张伟', 'u2'],
        ['r2', '寻找农业科技项目合伙人', 'project', '本人有意在南部县开展智慧农业项目，已有初步方案和部分资金，寻找有农业背景或技术背景的校友合作，共同推动家乡农业现代化。', '电话: 138****0001', '吴杰', null],
        ['r3', '天使轮投资机会：乡村旅游项目', 'invest', '南部县乡村旅游项目，依托当地自然资源，已完成商业计划书，寻求50-100万天使轮投资，预计3年回报率150%以上。', '微信: invest_nb', '王磊', null],
        ['r4', '南充市区房源出租信息', 'other', '本人在南充市顺庆区有一套120平三室两厅出租，精装修，家电齐全，月租2200元，适合家庭或多人合租，欢迎南部老乡联系。', '电话: 133****0007', '孙浩', null],
        ['r5', '深圳科技公司招聘产品经理', 'job', '深圳某知名科技公司招聘高级产品经理，负责移动端产品规划，要求5年以上经验，薪资30-50K+期权，欢迎南部老乡。', '邮箱: hr@example.com', '李娜', null]
    ];

    resources.forEach(r => {
        db.run(`INSERT OR IGNORE INTO resources (id, title, type, description, contact, author, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, r);
    });

    // 活动数据
    const activities = [
        ['act1', '2025年南部县校友春节联谊会', '2025-01-28 18:00:00', '2025-01-28 22:00:00', '南充市嘉陵宾馆', 200, '一年一度的春节校友聚会，共叙同窗情谊，欢迎各届校友携家属参加！', '总管理员', 'u0'],
        ['act2', '校友返乡创业交流会', '2025-03-15 14:00:00', '2025-03-15 17:00:00', '南部县文化中心', 100, '邀请在外创业有成的校友回乡分享经验，探讨返乡创业机遇，助力家乡经济发展。', '总管理员', 'u0'],
        ['act3', '母校捐书公益活动', '2025-04-20 09:00:00', '2025-04-20 12:00:00', '各成员学校', 0, '向母校图书馆捐赠书籍，为在校学生提供更多学习资源。每位参与校友捐赠不少于5本书籍。', '总管理员', 'u0'],
        ['act4', '2024年校友年会（已结束）', '2024-12-20 14:00:00', '2024-12-20 18:00:00', '南充市会展中心', 300, '2024年度校友年会，回顾一年来联盟发展成果，表彰优秀校友。', '总管理员', 'u0']
    ];

    activities.forEach(a => {
        db.run(`INSERT OR IGNORE INTO activities (id, name, start_time, end_time, location, capacity, description, organizer_name, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, a);
    });

    // 动态数据
    const posts = [
        ['p1', '回到母校南部中学参观，看到崭新的教学楼，感慨万千。希望学弟学妹们好好珍惜在校时光，努力学习！', '', '张伟', 'u2', '南部中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei'],
        ['p2', '今天在成都偶遇了南部二中的老同学，真是他乡遇故知！南部人在外要互相帮助，共同进步。', '', '李娜', null, '南部中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina'],
        ['p3', '南部县的嘉陵江风景真美，每次回家都被家乡的山水所打动。希望家乡越来越好！', '', '孙浩', null, '东坝中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao'],
        ['p4', '刚刚参加了校友返乡创业交流会，收获满满！感谢联盟组织这么好的活动，期待更多校友回乡创业，共建家乡！', '', '陈强', null, '南部三中', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang']
    ];

    posts.forEach(p => {
        db.run(`INSERT OR IGNORE INTO posts (id, content, image, author, author_id, school, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`, p);
    });

    console.log('初始数据插入完成');
}

// JWT验证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ code: 401, message: '未提供Token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ code: 403, message: 'Token无效' });
        }
        req.user = user;
        next();
    });
}

// 统一响应格式
function success(data) {
    return { code: 200, message: 'success', data };
}

function error(message, code = 500) {
    return { code, message, data: null };
}

// ===== API路由 =====

// 登录
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!user) return res.status(401).json(error('用户名或密码错误', 401));
        
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json(error('用户名或密码错误', 401));
        }
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        res.json(success({ token, user: userWithoutPassword }));
    });
});

// 获取当前用户
app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!user) return res.status(404).json(error('用户不存在', 404));
        res.json(success(user));
    });
});

// 获取所有学校
app.get('/api/schools', (req, res) => {
    db.all('SELECT s.*, COUNT(a.id) as alumni_count FROM schools s LEFT JOIN alumni a ON s.name = a.school AND a.status = "approved" GROUP BY s.id', [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取校友列表
app.get('/api/alumni', (req, res) => {
    const { keyword, school, level, year, classname } = req.query;
    let sql = 'SELECT * FROM alumni WHERE status = "approved"';
    const params = [];
    
    if (keyword) {
        sql += ' AND (name LIKE ? OR job LIKE ? OR company LIKE ? OR city LIKE ?)';
        const like = `%${keyword}%`;
        params.push(like, like, like, like);
    }
    if (school) {
        sql += ' AND school = ?';
        params.push(school);
    }
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }
    if (year) {
        sql += ' AND year = ?';
        params.push(year);
    }
    if (classname) {
        sql += ' AND classname = ?';
        params.push(classname);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取待审核校友（管理员权限）
app.get('/api/alumni/pending', authenticateToken, (req, res) => {
    // 检查权限
    if (!['superadmin', 'school_admin', 'class_admin'].includes(req.user.role)) {
        return res.status(403).json(error('权限不足'));
    }
    
    let sql = 'SELECT * FROM alumni WHERE status = "pending"';
    const params = [];
    
    // 学校管理员只能看自己学校的
    if (req.user.role === 'school_admin') {
        sql += ' AND school = ?';
        params.push(req.user.school);
    }
    // 班级管理员只能看自己班级的
    if (req.user.role === 'class_admin') {
        sql += ' AND school = ? AND year = ? AND classname = ?';
        params.push(req.user.school, req.user.year, req.user.classname);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取校友详情
app.get('/api/alumni/:id', (req, res) => {
    db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!row) return res.status(404).json(error('校友不存在', 404));
        res.json(success(row));
    });
});

// 添加校友
// 添加校友（需要登录）
app.post('/api/alumni', authenticateToken, (req, res) => {
    const id = 'a' + Date.now();
    const { name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id } = req.body;
    
    if (!name || !school) {
        return res.status(400).json(error('请填写姓名和学校'));
    }
    
    db.run(`INSERT INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [id, name, school, level || '', year || '', classname || '', phone || '', job || '', company || '', city || '', bio || '', avatar || '', user_id || req.user.id],
        function(err) {
            if (err) {
                console.error('添加校友失败:', err);
                return res.status(500).json(error('添加失败: ' + err.message));
            }
            console.log('✅ 校友添加成功:', id, name, school);
            db.get('SELECT * FROM alumni WHERE id = ?', [id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 更新校友
app.put('/api/alumni/:id', authenticateToken, (req, res) => {
    const { name, school, level, year, classname, phone, job, company, city, bio, avatar } = req.body;
    
    db.run(`UPDATE alumni SET name = ?, school = ?, level = ?, year = ?, classname = ?, phone = ?, job = ?, company = ?, city = ?, bio = ?, avatar = ? WHERE id = ?`,
        [name, school, level, year, classname, phone, job, company, city, bio, avatar, req.params.id],
        function(err) {
            if (err) return res.status(500).json(error('更新失败'));
            db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 删除校友
app.delete('/api/alumni/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM alumni WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json(error('删除失败'));
        res.json(success(null));
    });
});

// 审核通过
// 审核通过（管理员权限）
app.post('/api/alumni/:id/approve', authenticateToken, (req, res) => {
    // 检查权限
    if (!['superadmin', 'school_admin', 'class_admin'].includes(req.user.role)) {
        return res.status(403).json(error('权限不足'));
    }
    
    // 获取校友信息
    db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, alumni) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!alumni) return res.status(404).json(error('校友不存在'));
        
        // 权限验证：学校管理员只能审核自己学校的，班级管理员只能审核自己班级的
        if (req.user.role === 'school_admin' && alumni.school !== req.user.school) {
            return res.status(403).json(error('只能审核本校校友'));
        }
        if (req.user.role === 'class_admin' && 
            (alumni.school !== req.user.school || alumni.year !== req.user.year || alumni.classname !== req.user.classname)) {
            return res.status(403).json(error('只能审核本班校友'));
        }
        
        db.run('UPDATE alumni SET status = "approved" WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json(error('审核失败'));
            db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        });
    });
});

// 审核拒绝（管理员权限）
app.post('/api/alumni/:id/reject', authenticateToken, (req, res) => {
    // 检查权限
    if (!['superadmin', 'school_admin', 'class_admin'].includes(req.user.role)) {
        return res.status(403).json(error('权限不足'));
    }
    
    // 获取校友信息
    db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, alumni) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!alumni) return res.status(404).json(error('校友不存在'));
        
        // 权限验证
        if (req.user.role === 'school_admin' && alumni.school !== req.user.school) {
            return res.status(403).json(error('只能审核本校校友'));
        }
        if (req.user.role === 'class_admin' && 
            (alumni.school !== req.user.school || alumni.year !== req.user.year || alumni.classname !== req.user.classname)) {
            return res.status(403).json(error('只能审核本班校友'));
        }
        
        db.run('UPDATE alumni SET status = "rejected" WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json(error('审核失败'));
            db.get('SELECT * FROM alumni WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        });
    });
});

// 获取年份列表
app.get('/api/alumni/years', (req, res) => {
    const { school, level } = req.query;
    let sql = 'SELECT DISTINCT year FROM alumni WHERE year IS NOT NULL';
    const params = [];
    
    if (school) {
        sql += ' AND school = ?';
        params.push(school);
    }
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }
    sql += ' ORDER BY year DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows.map(r => r.year)));
    });
});

// 获取班级列表
app.get('/api/alumni/classes', (req, res) => {
    const { school, level, year } = req.query;
    let sql = 'SELECT DISTINCT classname FROM alumni WHERE classname IS NOT NULL';
    const params = [];
    
    if (school) {
        sql += ' AND school = ?';
        params.push(school);
    }
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }
    if (year) {
        sql += ' AND year = ?';
        params.push(year);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows.map(r => r.classname)));
    });
});

// 获取校友统计
app.get('/api/alumni/stats/by-school', (req, res) => {
    db.all('SELECT school, COUNT(*) as count FROM alumni WHERE status = "approved" GROUP BY school', [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        const stats = {};
        rows.forEach(r => stats[r.school] = r.count);
        res.json(success(stats));
    });
});

// 获取校友数量
app.get('/api/alumni/stats/count', (req, res) => {
    db.get('SELECT COUNT(*) as pending FROM alumni WHERE status = "pending"', [], (err, pending) => {
        db.get('SELECT COUNT(*) as approved FROM alumni WHERE status = "approved"', [], (err, approved) => {
            res.json(success({ pending: pending.pending, approved: approved.approved }));
        });
    });
});

// 获取资源列表
app.get('/api/resources', (req, res) => {
    const { type } = req.query;
    let sql = 'SELECT * FROM resources';
    const params = [];
    
    if (type && type !== 'all') {
        sql += ' WHERE type = ?';
        params.push(type);
    }
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取资源详情
app.get('/api/resources/:id', (req, res) => {
    db.get('SELECT * FROM resources WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!row) return res.status(404).json(error('资源不存在', 404));
        res.json(success(row));
    });
});

// 创建资源
app.post('/api/resources', authenticateToken, (req, res) => {
    const id = 'r' + Date.now();
    const { title, type, description, contact, author, author_id } = req.body;
    
    db.run(`INSERT INTO resources (id, title, type, description, contact, author, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, title, type, description, contact, author, author_id || req.user.id],
        function(err) {
            if (err) return res.status(500).json(error('创建失败'));
            db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 更新资源
app.put('/api/resources/:id', authenticateToken, (req, res) => {
    const { title, type, description, contact, author, author_id } = req.body;
    
    db.run(`UPDATE resources SET title = ?, type = ?, description = ?, contact = ?, author = ?, author_id = ? WHERE id = ?`,
        [title, type, description, contact, author, author_id, req.params.id],
        function(err) {
            if (err) return res.status(500).json(error('更新失败'));
            db.get('SELECT * FROM resources WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 删除资源
app.delete('/api/resources/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM resources WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json(error('删除失败'));
        res.json(success(null));
    });
});

// 获取活动列表
app.get('/api/activities', (req, res) => {
    const { status } = req.query;
    let sql = 'SELECT * FROM activities';
    const now = new Date().toISOString();
    
    if (status === 'upcoming') {
        sql += ` WHERE start_time > '${now}'`;
    } else if (status === 'ongoing') {
        sql += ` WHERE start_time <= '${now}' AND (end_time IS NULL OR end_time >= '${now}')`;
    } else if (status === 'ended') {
        sql += ` WHERE end_time < '${now}'`;
    }
    
    sql += ' ORDER BY start_time DESC';
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        
        // 获取每个活动的报名列表
        const activities = [];
        let count = 0;
        
        if (rows.length === 0) {
            return res.json(success([]));
        }
        
        rows.forEach(activity => {
            db.all('SELECT * FROM activity_signups WHERE activity_id = ? ORDER BY signed_at ASC', [activity.id], (err, signups) => {
                activity.signups = signups || [];
                activity.signup_count = signups ? signups.length : 0;
                activity.status = getActivityStatus(activity);
                activities.push(activity);
                count++;
                if (count === rows.length) {
                    res.json(success(activities));
                }
            });
        });
    });
});

function getActivityStatus(activity) {
    const now = new Date();
    const start = new Date(activity.start_time);
    const end = activity.end_time ? new Date(activity.end_time) : null;
    
    if (now < start) return 'upcoming';
    if (end && now > end) return 'ended';
    return 'ongoing';
}

// 获取活动详情
app.get('/api/activities/:id', (req, res) => {
    db.get('SELECT * FROM activities WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!row) return res.status(404).json(error('活动不存在', 404));
        
        db.all('SELECT * FROM activity_signups WHERE activity_id = ? ORDER BY signed_at ASC', [req.params.id], (err, signups) => {
            row.signups = signups || [];
            row.signup_count = signups ? signups.length : 0;
            row.status = getActivityStatus(row);
            res.json(success(row));
        });
    });
});

// 创建活动
app.post('/api/activities', authenticateToken, (req, res) => {
    const id = 'act' + Date.now();
    const { name, start_time, end_time, location, capacity, description, organizer_name, organizer_id } = req.body;
    
    db.run(`INSERT INTO activities (id, name, start_time, end_time, location, capacity, description, organizer_name, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, start_time, end_time, location, capacity, description, organizer_name, organizer_id || req.user.id],
        function(err) {
            if (err) return res.status(500).json(error('创建失败'));
            db.get('SELECT * FROM activities WHERE id = ?', [id], (err, row) => {
                row.signups = [];
                row.signup_count = 0;
                res.json(success(row));
            });
        }
    );
});

// 更新活动
app.put('/api/activities/:id', authenticateToken, (req, res) => {
    const { name, start_time, end_time, location, capacity, description, organizer_name, organizer_id } = req.body;
    
    db.run(`UPDATE activities SET name = ?, start_time = ?, end_time = ?, location = ?, capacity = ?, description = ?, organizer_name = ?, organizer_id = ? WHERE id = ?`,
        [name, start_time, end_time, location, capacity, description, organizer_name, organizer_id, req.params.id],
        function(err) {
            if (err) return res.status(500).json(error('更新失败'));
            db.get('SELECT * FROM activities WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 删除活动
app.delete('/api/activities/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM activities WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json(error('删除失败'));
        res.json(success(null));
    });
});

// 报名活动
app.post('/api/activities/:id/signup', authenticateToken, (req, res) => {
    const activityId = req.params.id;
    const userId = req.user.id;
    
    db.get('SELECT * FROM activities WHERE id = ?', [activityId], (err, activity) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!activity) return res.status(404).json(error('活动不存在', 404));
        
        // 检查是否已满
        db.get('SELECT COUNT(*) as count FROM activity_signups WHERE activity_id = ?', [activityId], (err, result) => {
            if (activity.capacity > 0 && result.count >= activity.capacity) {
                return res.status(400).json(error('活动名额已满', 400));
            }
            
            // 检查是否已报名
            db.get('SELECT * FROM activity_signups WHERE activity_id = ? AND user_id = ?', [activityId, userId], (err, existing) => {
                if (existing) {
                    return res.status(400).json(error('您已经报名了该活动', 400));
                }
                
                // 获取用户信息
                db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                    const id = 'su' + Date.now();
                    db.run(`INSERT INTO activity_signups (id, activity_id, user_id, name, avatar, school) VALUES (?, ?, ?, ?, ?, ?)`,
                        [id, activityId, userId, user.name || user.username, user.avatar, user.school],
                        function(err) {
                            if (err) return res.status(500).json(error('报名失败'));
                            db.get('SELECT * FROM activity_signups WHERE id = ?', [id], (err, row) => {
                                res.json(success(row));
                            });
                        }
                    );
                });
            });
        });
    });
});

// 取消报名
app.post('/api/activities/:id/cancel', authenticateToken, (req, res) => {
    db.run('DELETE FROM activity_signups WHERE activity_id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json(error('取消失败'));
        res.json(success(null));
    });
});

// 检查是否已报名
app.get('/api/activities/:id/is-signed-up', authenticateToken, (req, res) => {
    db.get('SELECT * FROM activity_signups WHERE activity_id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(!!row));
    });
});

// 获取动态列表
app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取最近动态
app.get('/api/posts/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取动态详情
app.get('/api/posts/:id', (req, res) => {
    db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!row) return res.status(404).json(error('动态不存在', 404));
        res.json(success(row));
    });
});

// 创建动态
app.post('/api/posts', authenticateToken, (req, res) => {
    const id = 'p' + Date.now();
    const { content, image, author, school, avatar } = req.body;
    
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        db.run(`INSERT INTO posts (id, content, image, author, author_id, school, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, content, image, author || user.name || user.username, req.user.id, school || user.school, avatar || user.avatar],
            function(err) {
                if (err) return res.status(500).json(error('发布失败'));
                db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
                    res.json(success(row));
                });
            }
        );
    });
});

// 删除动态
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM posts WHERE id = ? AND author_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json(error('删除失败'));
        res.json(success(null));
    });
});

// 获取用户列表
app.get('/api/users', authenticateToken, (req, res) => {
    db.all('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 获取用户详情
app.get('/api/users/:id', authenticateToken, (req, res) => {
    db.get('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!row) return res.status(404).json(error('用户不存在', 404));
        res.json(success(row));
    });
});

// 上传头像
app.post('/api/upload/avatar', authenticateToken, uploadAvatar.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '未上传文件', data: null });
  }
  
  const avatarUrl = '/uploads/avatars/' + req.file.filename;
  
  // 更新数据库中的头像URL
  db.run('UPDATE users SET avatar = ?, created_at = created_at WHERE id = ?', 
    [avatarUrl, req.user.id],
    function(err) {
      if (err) {
        // 删除上传的文件
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ code: 500, message: '保存失败', data: null });
      }
      res.json({ code: 200, message: 'success', data: { url: avatarUrl } });
    }
  );
});

// 更新用户资料
app.put('/api/users/profile', authenticateToken, (req, res) => {
    const { name, school, level, year, classname, job, city, bio, avatar } = req.body;
    
    db.run(`UPDATE users SET name = ?, school = ?, level = ?, year = ?, classname = ?, job = ?, city = ?, bio = ?, avatar = ? WHERE id = ?`,
        [name, school, level, year, classname, job, city, bio, avatar, req.user.id],
        function(err) {
            if (err) return res.status(500).json(error('更新失败'));
            db.get('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
                res.json(success(row));
            });
        }
    );
});

// 创建用户（管理员权限）
app.post('/api/users', authenticateToken, (req, res) => {
    // 检查管理员权限
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足，需要管理员权限'));
    }
    
    const { username, password, name, school, role, level, year, classname, job, city, bio, avatar, adminScope } = req.body;
    
    if (!username || !password) {
        return res.status(400).json(error('用户名和密码不能为空'));
    }
    
    // 检查用户名是否已存在
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (existingUser) return res.status(400).json(error('用户名已存在'));
        
        const id = 'u' + Date.now();
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // 如果提供了 adminScope，提取其中的字段
        let finalSchool = school || '';
        let finalLevel = level || '';
        let finalYear = year || null;
        let finalClassname = classname || '';
        
        if (adminScope) {
            try {
                const scope = typeof adminScope === 'string' ? JSON.parse(adminScope) : adminScope;
                finalSchool = scope.school || finalSchool;
                finalLevel = scope.level || finalLevel;
                finalYear = scope.year || finalYear;
                finalClassname = scope.classname || finalClassname;
            } catch (e) {
                console.error('解析 adminScope 失败:', e);
            }
        }
        
        db.run(`INSERT INTO users (id, username, password, name, role, school, level, year, classname, job, city, bio, avatar) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, username, hashedPassword, name || '', role || 'user', finalSchool, finalLevel, finalYear, finalClassname, job || '', city || '', bio || '', avatar || ''],
            function(err) {
                if (err) {
                    console.error('创建用户失败:', err);
                    return res.status(500).json(error('创建用户失败: ' + err.message));
                }
                db.get('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users WHERE id = ?', [id], (err, row) => {
                    res.json(success(row));
                });
            }
        );
    });
});

// 更新用户（管理员权限）
app.put('/api/users/:id', authenticateToken, (req, res) => {
    // 检查管理员权限
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足，需要管理员权限'));
    }
    
    const { username, password, name, school, role, level, year, classname, job, city, bio, avatar, adminScope } = req.body;
    
    // 检查用户是否存在
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, existingUser) => {
        if (err) return res.status(500).json(error('服务器错误'));
        if (!existingUser) return res.status(404).json(error('用户不存在', 404));
        
        // 如果提供了 adminScope，提取其中的字段
        let finalSchool = school;
        let finalLevel = level;
        let finalYear = year;
        let finalClassname = classname;
        
        if (adminScope) {
            try {
                const scope = typeof adminScope === 'string' ? JSON.parse(adminScope) : adminScope;
                finalSchool = scope.school || finalSchool;
                finalLevel = scope.level || finalLevel;
                finalYear = scope.year || finalYear;
                finalClassname = scope.classname || finalClassname;
            } catch (e) {
                console.error('解析 adminScope 失败:', e);
            }
        }
        
        // 构建更新语句
        let updateSql = 'UPDATE users SET username = ?, name = ?, role = ?, school = ?, level = ?, year = ?, classname = ?, job = ?, city = ?, bio = ?, avatar = ?';
        let updateParams = [username || existingUser.username, name, role, finalSchool, finalLevel, finalYear, finalClassname, job, city, bio, avatar];
        
        // 如果提供了新密码，则需要加密更新
        if (password && password.trim() !== '') {
            const hashedPassword = bcrypt.hashSync(password, 10);
            updateSql += ', password = ?';
            updateParams.push(hashedPassword);
        }
        
        updateSql += ' WHERE id = ?';
        updateParams.push(req.params.id);
        
        db.run(updateSql, updateParams, function(err) {
            if (err) {
                console.error('更新用户失败:', err);
                return res.status(500).json(error('更新用户失败'));
            }
            db.get('SELECT id, username, name, role, school, level, year, classname, job, city, bio, avatar, created_at FROM users WHERE id = ?', [req.params.id], (err, row) => {
                res.json(success(row));
            });
        });
    });
});

// 删除用户（管理员权限）
app.delete('/api/users/:id', authenticateToken, (req, res) => {
    // 检查管理员权限
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足，需要管理员权限'));
    }
    
    // 不允许删除自己
    if (req.params.id === req.user.id) {
        return res.status(400).json(error('不能删除自己的账户'));
    }
    
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json(error('删除用户失败'));
        if (this.changes === 0) return res.status(404).json(error('用户不存在', 404));
        res.json(success(null));
    });
});

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
