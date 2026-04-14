/**
 * 生成500个校友数据的初始化脚本
 * 运行方式: node generate-alumni.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 真实年轻头像URL（来自Unsplash）
const avatars = [
    // 女生头像 (20个)
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1523264766114-6e9a4724534c?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1485875437071-bb711905f5f3?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=face',
    // 男生头像 (20个)
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1480429370612-2b0cf398ac8d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1532079176997-81e84f956d24?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1488161628813-04466f364995?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=150&h=150&fit=crop&crop=face'
];

// 常见姓名
const familyNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧'];
const maleNames = ['伟', '强', '磊', '军', '杰', '涛', '明', '华', '亮', '鹏', '飞', '宇', '浩', '天', '然', '博', '文', '志', '建国', '志强', '文博', '浩然', '子轩', '雨泽', '梓豪', '俊杰', '宇航', '晨曦', '旭东', '泽民'];
const femaleNames = ['芳', '娜', '丽', '敏', '静', '秀英', '玉兰', '雪', '梅', '婷', '倩', '媛', '蕾', '欣', '怡', '梦', '瑶', '佳', '雨涵', '思颖', '诗涵', '欣怡', '梦琪', '雅婷', '若曦', '晓燕', '美玲', '佳琪', '思琪', '雨萱'];

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
    {job: 'UI设计师', company: '美团'},
    {job: '会计', company: '德勤'},
    {job: '人力资源', company: '万科'},
    {job: '市场营销', company: '宝洁'},
    {job: '项目经理', company: '中国移动'}
];

const cities = ['北京', '上海', '广州', '深圳', '成都', '重庆', '杭州', '南京', '武汉', '西安', '南充', '绵阳', '苏州', '天津', '长沙'];
const schools = ['南部中学', '南部二中', '南部三中', '大桥中学', '东坝中学', '建兴中学'];
const levels = ['初中', '高中'];
const classNames = {
    '初中': ['初三(1)班', '初三(2)班', '初三(3)班'],
    '高中': ['高三(1)班', '高三(2)班', '高三(3)班', '高三(4)班']
};
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
    '愿母校桃李满天下。',
    '毕业多年，依然怀念校园生活。',
    '期待与老同学重聚。',
    '为母校的成就感到自豪。',
    '希望能帮助学弟学妹们。',
    '家乡的变化真大，为你骄傲！'
];

// 辅助函数：随机选择
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 辅助函数：随机手机号
function randomPhone() {
    const prefix = ['138', '139', '136', '137', '135', '134', '133', '132', '131', '130', '189', '188', '187', '186', '185', '159', '158', '157', '156', '155'];
    return randomChoice(prefix) + '****' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

// 生成500个校友
console.log('🚀 开始生成500个校友数据...');

const alumniData = [];
const usedNames = new Set();

for (let i = 0; i < 500; i++) {
    const id = `a_gen_${i + 1}`;
    
    // 生成唯一姓名
    let name;
    do {
        const isFemale = Math.random() > 0.5;
        const familyName = randomChoice(familyNames);
        const givenName = isFemale ? randomChoice(femaleNames) : randomChoice(maleNames);
        name = familyName + givenName;
    } while (usedNames.has(name));
    usedNames.add(name);
    
    const isFemale = name.match(/芳|娜|丽|敏|静|英|兰|雪|梅|婷|倩|媛|蕾|欣|怡|梦|瑶|佳|涵|颖|诗|曦|燕|玲|琪|萱/);
    const avatar = isFemale ? randomChoice(avatars.slice(0, 20)) : randomChoice(avatars.slice(20));
    
    const school = randomChoice(schools);
    const level = randomChoice(levels);
    const year = randomChoice(years);
    const classname = randomChoice(classNames[level]);
    const jobInfo = randomChoice(jobs);
    const city = randomChoice(cities);
    const bio = randomChoice(bios);
    const phone = randomPhone();
    
    // 90%审核通过，10%待审核
    const status = Math.random() > 0.1 ? 'approved' : 'pending';
    
    alumniData.push([
        id, name, school, level, year, classname, phone,
        jobInfo.job, jobInfo.company, city, bio, avatar,
        null, status
    ]);
}

// 插入数据库
console.log('📦 正在插入数据库...');

db.serialize(() => {
    let inserted = 0;
    
    alumniData.forEach((data, index) => {
        db.run(
            `INSERT OR IGNORE INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            data,
            function(err) {
                if (err) {
                    console.error(`❌ 插入失败 ${data[1]}:`, err.message);
                } else {
                    inserted++;
                }
                
                if (index === alumniData.length - 1) {
                    console.log(`✅ 成功插入 ${inserted} 个校友数据`);
                    console.log(`📊 总计: ${alumniData.length} 个，跳过: ${alumniData.length - inserted} 个`);
                    db.close();
                }
            }
        );
    });
});

console.log('✨ 数据生成完成！');
