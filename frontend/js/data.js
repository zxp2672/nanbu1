// ===== 本地存储工具 =====
const DB = {
  get(key, def = []) { try { return JSON.parse(localStorage.getItem('nb_' + key)) ?? def; } catch { return def; } },
  set(key, v) { localStorage.setItem('nb_' + key, JSON.stringify(v)); },
  id() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
};

// ===== 学校数据 =====
const SCHOOLS = [
  { id: 's1', name: '南部中学', short: 'nb1', icon: '🏫', desc: '南部县重点高中，创建于1950年，历史悠久，英才辈出。', founded: 1950, color: '#1a6fc4' },
  { id: 's2', name: '南部二中', short: 'nb2', icon: '🏫', desc: '南部县第二中学，办学严谨，培育了大批优秀学子。', founded: 1962, color: '#7c3aed' },
  { id: 's3', name: '南部三中', short: 'nb3', icon: '🏫', desc: '南部县第三中学，注重素质教育，全面发展。', founded: 1975, color: '#059669' },
  { id: 's4', name: '大桥中学', short: 'dq', icon: '🏫', desc: '大桥镇中学，扎根乡土，服务地方教育事业。', founded: 1968, color: '#d97706' },
  { id: 's5', name: '东坝中学', short: 'db', icon: '🏫', desc: '东坝镇中学，勤奋务实，培养了众多优秀人才。', founded: 1972, color: '#dc2626' },
  { id: 's6', name: '建兴中学', short: 'jx', icon: '🏫', desc: '建兴镇中学，艰苦奋斗，为地方发展贡献力量。', founded: 1980, color: '#0891b2' },
];

// ===== 演示数据 =====
const DEMO = {
  users: [
    // 总管理员
    { id: 'u0', username: 'admin', password: '123456', role: 'superadmin', name: '总管理员', school: '', level: '', year: '', classname: '', job: '系统管理员', city: '南充', bio: '南部县校友联盟总管理员', avatar: '', adminScope: {}, createdAt: '2024-01-01' },
    // 学校管理员
    { id: 'u_nb1', username: 'nb1_admin', password: '123456', role: 'school_admin', name: '南部中学管理员', school: '南部中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学' }, createdAt: '2024-01-01' },
    { id: 'u_nb2', username: 'nb2_admin', password: '123456', role: 'school_admin', name: '南部二中管理员', school: '南部二中', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部二中' }, createdAt: '2024-01-01' },
    { id: 'u_nb3', username: 'nb3_admin', password: '123456', role: 'school_admin', name: '南部三中管理员', school: '南部三中', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部三中' }, createdAt: '2024-01-01' },
    { id: 'u_dq', username: 'dq_admin', password: '123456', role: 'school_admin', name: '大桥中学管理员', school: '大桥中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '大桥中学' }, createdAt: '2024-01-01' },
    { id: 'u_db', username: 'db_admin', password: '123456', role: 'school_admin', name: '东坝中学管理员', school: '东坝中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '东坝中学' }, createdAt: '2024-01-01' },
    { id: 'u_jx', username: 'jx_admin', password: '123456', role: 'school_admin', name: '建兴中学管理员', school: '建兴中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '建兴中学' }, createdAt: '2024-01-01' },
    // 年级管理员
    { id: 'u_nb1_2005', username: 'nb1_2005_admin', password: '123456', role: 'grade_admin', name: '南部中学2005级管理员', school: '南部中学', level: '高中', year: 2005, classname: '', job: '年级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2005 }, createdAt: '2024-01-01' },
    { id: 'u_nb1_2010', username: 'nb1_2010_admin', password: '123456', role: 'grade_admin', name: '南部中学2010级管理员', school: '南部中学', level: '高中', year: 2010, classname: '', job: '年级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2010 }, createdAt: '2024-01-01' },
    // 班级管理员
    { id: 'u_nb1_2005_1', username: 'nb1_2005_1_admin', password: '123456', role: 'class_admin', name: '南部中学2005级高三1班管理员', school: '南部中学', level: '高中', year: 2005, classname: '高三(1)班', job: '班级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2005, classname: '高三(1)班' }, createdAt: '2024-01-01' },
    { id: 'u_nb1_2010_2', username: 'nb1_2010_2_admin', password: '123456', role: 'class_admin', name: '南部中学2010级高三2班管理员', school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班', job: '班级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班' }, createdAt: '2024-01-01' },
    // 普通用户
    { id: 'u2', username: 'user', password: '123456', role: 'user', name: '张同学', school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班', job: '软件工程师', city: '成都', bio: '热爱编程，关注家乡发展。', avatar: '', adminScope: {}, createdAt: '2024-01-02' },
    { id: 'u3', username: 'li', password: '123456', role: 'user', name: '李同学', school: '南部二中', level: '高中', year: 2012, classname: '高三(3)班', job: '教师', city: '南充', bio: '回到家乡，投身教育。', avatar: '', adminScope: {}, createdAt: '2024-01-03' },
  ],
  alumni: [
    { id: 'a1', name: '张伟', school: '南部中学', level: '高中', year: 2005, classname: '高三(1)班', phone: '138****0001', job: '高级工程师', company: '腾讯科技', city: '深圳', bio: '专注后端开发，热爱开源。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', userId: 'u2', status: 'approved', createdAt: '2024-01-10' },
    { id: 'a2', name: '李娜', school: '南部中学', level: '高中', year: 2006, classname: '高三(2)班', phone: '139****0002', job: '产品经理', company: '阿里巴巴', city: '杭州', bio: '用户体验爱好者，关注产品设计。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina', userId: '', status: 'approved', createdAt: '2024-01-11' },
    { id: 'a3', name: '王磊', school: '南部二中', level: '高中', year: 2008, classname: '高三(1)班', phone: '137****0003', job: '投资分析师', company: '中信证券', city: '北京', bio: '专注股权投资，关注新兴产业。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglei', userId: '', status: 'approved', createdAt: '2024-01-12' },
    { id: 'a4', name: '刘芳', school: '南部二中', level: '初中', year: 2005, classname: '初三(2)班', phone: '136****0004', job: '财务总监', company: '招商银行', city: '上海', bio: '十年财务经验，CPA持证人。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang', userId: '', status: 'approved', createdAt: '2024-01-13' },
    { id: 'a5', name: '陈强', school: '南部三中', level: '高中', year: 2010, classname: '高三(3)班', phone: '135****0005', job: '技术总监', company: '比亚迪', city: '深圳', bio: '新能源汽车专家，专注智能驾驶。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang', userId: '', status: 'approved', createdAt: '2024-01-14' },
    { id: 'a6', name: '赵敏', school: '大桥中学', level: '高中', year: 2009, classname: '高三(1)班', phone: '134****0006', job: '副教授', company: '西南大学', city: '重庆', bio: '教育心理学研究，关注青少年发展。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomin', userId: '', status: 'approved', createdAt: '2024-01-15' },
    { id: 'a7', name: '孙浩', school: '东坝中学', level: '高中', year: 2007, classname: '高三(2)班', phone: '133****0007', job: '主治医师', company: '南充市中心医院', city: '南充', bio: '心血管内科专家，热爱公益医疗。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao', userId: '', status: 'approved', createdAt: '2024-01-16' },
    { id: 'a8', name: '周婷', school: '建兴中学', level: '初中', year: 2008, classname: '初三(1)班', phone: '132****0008', job: '记者', company: '四川日报', city: '成都', bio: '专注深度报道，关注社会民生。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouting', userId: '', status: 'approved', createdAt: '2024-01-17' },
    { id: 'a9', name: '吴杰', school: '南部中学', level: '高中', year: 2003, classname: '高三(4)班', phone: '131****0009', job: '公务员', company: '南部县政府', city: '南充', bio: '服务家乡建设，推动地方发展。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wujie', userId: '', status: 'approved', createdAt: '2024-01-18' },
    { id: 'a10', name: '郑雪', school: '南部中学', level: '高中', year: 2004, classname: '高三(1)班', phone: '130****0010', job: 'CTO', company: '字节跳动', city: '北京', bio: '人工智能领域专家，关注大模型应用。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengxue', userId: '', status: 'approved', createdAt: '2024-01-19' },
    { id: 'a11', name: '黄鹏', school: '南部中学', level: '高中', year: 2010, classname: '高三(1)班', phone: '189****0011', job: '架构师', company: '华为', city: '深圳', bio: '云计算与分布式系统专家。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangpeng', userId: '', status: 'approved', createdAt: '2024-02-01' },
    { id: 'a12', name: '林晓燕', school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班', phone: '188****0012', job: 'UI设计师', company: '网易', city: '广州', bio: '专注用户界面设计，热爱艺术。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linxiaoyan', userId: '', status: 'approved', createdAt: '2024-02-02' },
    { id: 'a13', name: '马超', school: '南部二中', level: '高中', year: 2010, classname: '高三(2)班', phone: '187****0013', job: '律师', company: '北京大成律师事务所', city: '北京', bio: '专注商业法律，服务企业合规。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=machao', userId: '', status: 'approved', createdAt: '2024-02-03' },
    { id: 'a14', name: '谢雨', school: '南部三中', level: '初中', year: 2008, classname: '初三(1)班', phone: '186****0014', job: '数据科学家', company: '百度', city: '北京', bio: '机器学习与数据挖掘专家。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xieyu', userId: '', status: 'pending', createdAt: '2024-03-01' },
    { id: 'a15', name: '冯涛', school: '大桥中学', level: '高中', year: 2012, classname: '高三(3)班', phone: '185****0015', job: '创业者', company: '成都某科技公司', city: '成都', bio: '连续创业者，专注农业科技。', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fengtao', userId: '', status: 'pending', createdAt: '2024-03-02' },
  ],
  resources: [
    { id: 'r1', title: '成都互联网公司招聘Java工程师', type: 'job', desc: '我司（成都某上市互联网公司）急招Java后端工程师3名，要求3年以上经验，熟悉Spring Boot，薪资20-35K，欢迎南部老乡投递简历。', contact: '微信: zhangwei_job', author: '张伟', authorId: 'u2', createdAt: '2024-11-01' },
    { id: 'r2', title: '寻找农业科技项目合伙人', type: 'project', desc: '本人有意在南部县开展智慧农业项目，已有初步方案和部分资金，寻找有农业背景或技术背景的校友合作，共同推动家乡农业现代化。', contact: '电话: 138****0001', author: '吴杰', authorId: '', createdAt: '2024-10-15' },
    { id: 'r3', title: '天使轮投资机会：乡村旅游项目', type: 'invest', desc: '南部县乡村旅游项目，依托当地自然资源，已完成商业计划书，寻求50-100万天使轮投资，预计3年回报率150%以上。', contact: '微信: invest_nb', author: '王磊', authorId: '', createdAt: '2024-09-20' },
    { id: 'r4', title: '南充市区房源出租信息', type: 'other', desc: '本人在南充市顺庆区有一套120平三室两厅出租，精装修，家电齐全，月租2200元，适合家庭或多人合租，欢迎南部老乡联系。', contact: '电话: 133****0007', author: '孙浩', authorId: '', createdAt: '2024-08-10' },
    { id: 'r5', title: '深圳科技公司招聘产品经理', type: 'job', desc: '深圳某知名科技公司招聘高级产品经理，负责移动端产品规划，要求5年以上经验，薪资30-50K+期权，欢迎南部老乡。', contact: '邮箱: hr@example.com', author: '李娜', authorId: '', createdAt: '2024-07-05' },
  ],
  activities: [
    { id: 'act1', name: '2025年南部县校友春节联谊会', startTime: '2025-01-28T18:00', endTime: '2025-01-28T22:00', location: '南充市嘉陵宾馆', desc: '一年一度的春节校友聚会，共叙同窗情谊，欢迎各届校友携家属参加！', capacity: 200, organizer: { name: '总管理员', userId: 'u0', avatar: '' }, signups: [{ userId: 'u0', name: '总管理员', avatar: '', time: '2024-12-10T10:00:00' }, { userId: 'u2', name: '张同学', avatar: '', time: '2024-12-11T14:30:00' }], createdAt: '2024-12-01' },
    { id: 'act2', name: '校友返乡创业交流会', startTime: '2025-03-15T14:00', endTime: '2025-03-15T17:00', location: '南部县文化中心', desc: '邀请在外创业有成的校友回乡分享经验，探讨返乡创业机遇，助力家乡经济发展。', capacity: 100, organizer: { name: '总管理员', userId: 'u0', avatar: '' }, signups: [{ userId: 'u0', name: '总管理员', avatar: '', time: '2025-01-15T09:00:00' }], createdAt: '2025-01-10' },
    { id: 'act3', name: '母校捐书公益活动', startTime: '2025-04-20T09:00', endTime: '2025-04-20T12:00', location: '各成员学校', desc: '向母校图书馆捐赠书籍，为在校学生提供更多学习资源。每位参与校友捐赠不少于5本书籍。', capacity: 0, organizer: { name: '总管理员', userId: 'u0', avatar: '' }, signups: [], createdAt: '2025-02-01' },
    { id: 'act4', name: '2024年校友年会（已结束）', startTime: '2024-12-20T14:00', endTime: '2024-12-20T18:00', location: '南充市会展中心', desc: '2024年度校友年会，回顾一年来联盟发展成果，表彰优秀校友。', capacity: 300, organizer: { name: '总管理员', userId: 'u0', avatar: '' }, signups: [{ userId: 'u0', name: '总管理员', avatar: '', time: '2024-11-10T10:00:00' }, { userId: 'u2', name: '张同学', avatar: '', time: '2024-11-11T15:00:00' }, { userId: 'u3', name: '李同学', avatar: '', time: '2024-11-12T09:00:00' }], createdAt: '2024-11-01' },
  ],
  posts: [
    { id: 'p1', content: '回到母校南部中学参观，看到崭新的教学楼，感慨万千。希望学弟学妹们好好珍惜在校时光，努力学习！', image: '', author: '张伟', authorId: 'u2', school: '南部中学', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', createdAt: '2024-11-15T10:30:00' },
    { id: 'p2', content: '今天在成都偶遇了南部二中的老同学，真是他乡遇故知！南部人在外要互相帮助，共同进步。', image: '', author: '李娜', authorId: '', school: '南部中学', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina', createdAt: '2024-11-10T15:20:00' },
    { id: 'p3', content: '南部县的嘉陵江风景真美，每次回家都被家乡的山水所打动。希望家乡越来越好！🌊', image: '', author: '孙浩', authorId: '', school: '东坝中学', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao', createdAt: '2024-11-05T09:00:00' },
    { id: 'p4', content: '刚刚参加了校友返乡创业交流会，收获满满！感谢联盟组织这么好的活动，期待更多校友回乡创业，共建家乡！💪', image: '', author: '陈强', authorId: '', school: '南部三中', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang', createdAt: '2024-10-20T16:00:00' },
  ]
};

function initData() {
  if (!localStorage.getItem('nb_v2_initialized')) {
    DB.set('users', DEMO.users);
    DB.set('alumni', DEMO.alumni);
    DB.set('resources', DEMO.resources);
    DB.set('activities', DEMO.activities);
    DB.set('posts', DEMO.posts);
    localStorage.setItem('nb_v2_initialized', '1');
  }
}

function resetData() {
  DB.set('users', DEMO.users);
  DB.set('alumni', DEMO.alumni);
  DB.set('resources', DEMO.resources);
  DB.set('activities', DEMO.activities);
  DB.set('posts', DEMO.posts);
  localStorage.removeItem('nb_v2_initialized');
  localStorage.setItem('nb_v2_initialized', '1');
}

// ===== 权限工具 =====
const Perm = {
  isSuperAdmin(u) { return u && u.role === 'superadmin'; },
  isAnyAdmin(u) { return u && ['superadmin','school_admin','grade_admin','class_admin'].includes(u.role); },
  canManageAlumni(u, a) {
    if (!u || !a) return false;
    if (u.role === 'superadmin') return true;
    const s = u.adminScope || {};
    if (u.role === 'school_admin') return a.school === s.school;
    if (u.role === 'grade_admin') return a.school === s.school && a.level === s.level && String(a.year) === String(s.year);
    if (u.role === 'class_admin') return a.school === s.school && a.level === s.level && String(a.year) === String(s.year) && a.classname === s.classname;
    return false;
  },
  canApprove(u, a) { return this.canManageAlumni(u, a); },
  roleLabel(role) {
    return { superadmin: '总管理员', school_admin: '学校管理员', grade_admin: '年级管理员', class_admin: '班级管理员', user: '普通用户' }[role] || role;
  }
};

// ===== Services =====
const UserSvc = {
  getAll() { return DB.get('users'); },
  login(u, p) { return this.getAll().find(x => x.username === u && x.password === p) || null; },
  getById(id) { return this.getAll().find(u => u.id === id); },
  update(id, data) {
    const list = this.getAll(), i = list.findIndex(u => u.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data }; DB.set('users', list); return list[i]; }
    return null;
  },
  add(data) {
    const list = this.getAll();
    if (list.find(u => u.username === data.username)) return null;
    const item = { ...data, id: DB.id(), adminScope: data.adminScope || {}, createdAt: new Date().toISOString().split('T')[0] };
    list.push(item); DB.set('users', list); return item;
  },
  delete(id) {
    const list = this.getAll();
    if (list.find(u => u.id === id && u.username === 'admin')) return false;
    DB.set('users', list.filter(u => u.id !== id)); return true;
  }
};

const AlumniSvc = {
  getAll() { return DB.get('alumni'); },
  getApproved() { return this.getAll().filter(a => a.status === 'approved'); },
  getPending() { return this.getAll().filter(a => a.status === 'pending'); },
  getById(id) { return this.getAll().find(a => a.id === id); },
  add(data) {
    const list = this.getAll();
    const item = { ...data, id: DB.id(), status: 'pending', createdAt: new Date().toISOString().split('T')[0] };
    list.push(item); DB.set('alumni', list); return item;
  },
  update(id, data) {
    const list = this.getAll(), i = list.findIndex(a => a.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data }; DB.set('alumni', list); return list[i]; }
    return null;
  },
  approve(id) { return this.update(id, { status: 'approved' }); },
  reject(id) { return this.update(id, { status: 'rejected' }); },
  delete(id) { DB.set('alumni', this.getAll().filter(a => a.id !== id)); },
  filter(school, level, year, classname) {
    let list = this.getApproved();
    if (school) list = list.filter(a => a.school === school);
    if (level) list = list.filter(a => a.level === level);
    if (year) list = list.filter(a => String(a.year) === String(year));
    if (classname) list = list.filter(a => a.classname === classname);
    return list;
  },
  search(q, school, level, year, classname) {
    let list = this.filter(school, level, year, classname);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(lq) ||
        (a.classname && a.classname.includes(q)) ||
        (a.job && a.job.toLowerCase().includes(lq)) ||
        (a.company && a.company.toLowerCase().includes(lq)) ||
        (a.city && a.city.includes(q))
      );
    }
    return list;
  },
  getClasses(school, level, year) {
    return [...new Set(this.getApproved()
      .filter(a => (!school || a.school === school) && (!level || a.level === level) && (!year || String(a.year) === String(year)))
      .map(a => a.classname).filter(Boolean))].sort();
  }
};

const ResourceSvc = {
  getAll() { return DB.get('resources').sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)); },
  add(data) {
    const list = DB.get('resources');
    const item = { ...data, id: DB.id(), createdAt: new Date().toISOString().split('T')[0] };
    list.push(item); DB.set('resources', list); return item;
  },
  update(id, data) {
    const list = DB.get('resources'), i = list.findIndex(r => r.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data }; DB.set('resources', list); }
  },
  delete(id) { DB.set('resources', DB.get('resources').filter(r => r.id !== id)); },
  filter(type) {
    const list = this.getAll();
    return type && type !== 'all' ? list.filter(r => r.type === type) : list;
  },
  getByUser(uid) { return this.getAll().filter(r => r.authorId === uid); }
};

const ActivitySvc = {
  getAll() { return DB.get('activities').sort((a,b) => new Date(b.startTime)-new Date(a.startTime)); },
  getById(id) { return this.getAll().find(a => a.id === id); },
  add(data) {
    const list = DB.get('activities');
    const item = { ...data, id: DB.id(), signups: [], createdAt: new Date().toISOString().split('T')[0] };
    list.push(item); DB.set('activities', list); return item;
  },
  update(id, data) {
    const list = DB.get('activities'), i = list.findIndex(a => a.id === id);
    if (i !== -1) { list[i] = { ...list[i], ...data }; DB.set('activities', list); }
  },
  delete(id) { DB.set('activities', DB.get('activities').filter(a => a.id !== id)); },
  getStatus(a) {
    const now = new Date(), s = new Date(a.startTime), e = a.endTime ? new Date(a.endTime) : null;
    if (now < s) return 'upcoming';
    if (e && now > e) return 'ended';
    return 'ongoing';
  },
  signup(id, user) {
    const list = DB.get('activities'), i = list.findIndex(a => a.id === id);
    if (i === -1) return false;
    if (!list[i].signups) list[i].signups = [];
    if (list[i].signups.find(s => s.userId === user.id)) return 'already';
    if (list[i].capacity > 0 && list[i].signups.length >= list[i].capacity) return 'full';
    list[i].signups.push({ userId: user.id, name: user.name || user.username, avatar: user.avatar || '', time: new Date().toISOString() });
    DB.set('activities', list); return true;
  },
  cancelSignup(id, userId) {
    const list = DB.get('activities'), i = list.findIndex(a => a.id === id);
    if (i !== -1) { list[i].signups = (list[i].signups || []).filter(s => s.userId !== userId); DB.set('activities', list); }
  },
  filter(status) {
    const list = this.getAll();
    return status && status !== 'all' ? list.filter(a => this.getStatus(a) === status) : list;
  },
  getByUser(uid) { return this.getAll().filter(a => (a.signups||[]).find(s => s.userId === uid)); }
};

const PostSvc = {
  getAll() { return DB.get('posts').sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)); },
  getByUser(uid) { return this.getAll().filter(p => p.authorId === uid); },
  add(data) {
    const list = DB.get('posts');
    const item = { ...data, id: DB.id(), createdAt: new Date().toISOString() };
    list.push(item); DB.set('posts', list); return item;
  },
  delete(id) { DB.set('posts', DB.get('posts').filter(p => p.id !== id)); }
};

initData();
