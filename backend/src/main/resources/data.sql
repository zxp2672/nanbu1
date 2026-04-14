-- 南部县校友联盟初始数据
-- 密码使用BCrypt加密，明文为: 123456

-- 插入学校数据
INSERT INTO schools (name, short_name, icon, description, founded_year, color) VALUES
('南部中学', 'nb1', '🏫', '南部县重点高中，创建于1950年，历史悠久，英才辈出。', 1950, '#1a6fc4'),
('南部二中', 'nb2', '🏫', '南部县第二中学，办学严谨，培育了大批优秀学子。', 1962, '#7c3aed'),
('南部三中', 'nb3', '🏫', '南部县第三中学，注重素质教育，全面发展。', 1975, '#059669'),
('大桥中学', 'dq', '🏫', '大桥镇中学，扎根乡土，服务地方教育事业。', 1968, '#d97706'),
('东坝中学', 'db', '🏫', '东坝镇中学，勤奋务实，培养了众多优秀人才。', 1972, '#dc2626'),
('建兴中学', 'jx', '🏫', '建兴镇中学，艰苦奋斗，为地方发展贡献力量。', 1980, '#0891b2')
ON DUPLICATE KEY UPDATE name = name;

-- 插入用户数据
-- 总管理员
INSERT INTO users (id, username, password, name, role, job, city, bio, created_at) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '总管理员', 'superadmin', '系统管理员', '南充', '南部县校友联盟总管理员', '2024-01-01')
ON DUPLICATE KEY UPDATE username = username;

-- 学校管理员
INSERT INTO users (id, username, password, name, role, school, job, city, created_at) VALUES
(2, 'nb1_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部中学管理员', 'school_admin', '南部中学', '学校管理员', '南充', '2024-01-01'),
(3, 'nb2_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部二中管理员', 'school_admin', '南部二中', '学校管理员', '南充', '2024-01-01'),
(4, 'nb3_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部三中管理员', 'school_admin', '南部三中', '学校管理员', '南充', '2024-01-01'),
(5, 'dq_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '大桥中学管理员', 'school_admin', '大桥中学', '学校管理员', '南充', '2024-01-01'),
(6, 'db_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '东坝中学管理员', 'school_admin', '东坝中学', '学校管理员', '南充', '2024-01-01'),
(7, 'jx_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '建兴中学管理员', 'school_admin', '建兴中学', '学校管理员', '南充', '2024-01-01')
ON DUPLICATE KEY UPDATE username = username;

-- 年级管理员
INSERT INTO users (id, username, password, name, role, school, level, year, job, city, created_at) VALUES
(8, 'nb1_2005_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部中学2005级管理员', 'grade_admin', '南部中学', '高中', 2005, '年级管理员', '南充', '2024-01-01'),
(9, 'nb1_2010_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部中学2010级管理员', 'grade_admin', '南部中学', '高中', 2010, '年级管理员', '南充', '2024-01-01')
ON DUPLICATE KEY UPDATE username = username;

-- 班级管理员
INSERT INTO users (id, username, password, name, role, school, level, year, classname, job, city, created_at) VALUES
(10, 'nb1_2005_1_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部中学2005级高三1班管理员', 'class_admin', '南部中学', '高中', 2005, '高三(1)班', '班级管理员', '南充', '2024-01-01'),
(11, 'nb1_2010_2_admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '南部中学2010级高三2班管理员', 'class_admin', '南部中学', '高中', 2010, '高三(2)班', '班级管理员', '南充', '2024-01-01')
ON DUPLICATE KEY UPDATE username = username;

-- 普通用户
INSERT INTO users (id, username, password, name, role, school, level, year, classname, job, city, bio, created_at) VALUES
(12, 'user', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '张同学', 'user', '南部中学', '高中', 2010, '高三(2)班', '软件工程师', '成都', '热爱编程，关注家乡发展。', '2024-01-02'),
(13, 'li', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '李同学', 'user', '南部二中', '高中', 2012, '高三(3)班', '教师', '南充', '回到家乡，投身教育。', '2024-01-03')
ON DUPLICATE KEY UPDATE username = username;

-- 插入校友数据
INSERT INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status, created_at) VALUES
(1, '张伟', '南部中学', '高中', 2005, '高三(1)班', '138****0001', '高级工程师', '腾讯科技', '深圳', '专注后端开发，热爱开源。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', 12, 'approved', '2024-01-10'),
(2, '李娜', '南部中学', '高中', 2006, '高三(2)班', '139****0002', '产品经理', '阿里巴巴', '杭州', '用户体验爱好者，关注产品设计。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina', NULL, 'approved', '2024-01-11'),
(3, '王磊', '南部二中', '高中', 2008, '高三(1)班', '137****0003', '投资分析师', '中信证券', '北京', '专注股权投资，关注新兴产业。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglei', NULL, 'approved', '2024-01-12'),
(4, '刘芳', '南部二中', '初中', 2005, '初三(2)班', '136****0004', '财务总监', '招商银行', '上海', '十年财务经验，CPA持证人。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang', NULL, 'approved', '2024-01-13'),
(5, '陈强', '南部三中', '高中', 2010, '高三(3)班', '135****0005', '技术总监', '比亚迪', '深圳', '新能源汽车专家，专注智能驾驶。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang', NULL, 'approved', '2024-01-14'),
(6, '赵敏', '大桥中学', '高中', 2009, '高三(1)班', '134****0006', '副教授', '西南大学', '重庆', '教育心理学研究，关注青少年发展。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomin', NULL, 'approved', '2024-01-15'),
(7, '孙浩', '东坝中学', '高中', 2007, '高三(2)班', '133****0007', '主治医师', '南充市中心医院', '南充', '心血管内科专家，热爱公益医疗。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao', NULL, 'approved', '2024-01-16'),
(8, '周婷', '建兴中学', '初中', 2008, '初三(1)班', '132****0008', '记者', '四川日报', '成都', '专注深度报道，关注社会民生。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouting', NULL, 'approved', '2024-01-17'),
(9, '吴杰', '南部中学', '高中', 2003, '高三(4)班', '131****0009', '公务员', '南部县政府', '南充', '服务家乡建设，推动地方发展。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wujie', NULL, 'approved', '2024-01-18'),
(10, '郑雪', '南部中学', '高中', 2004, '高三(1)班', '130****0010', 'CTO', '字节跳动', '北京', '人工智能领域专家，关注大模型应用。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengxue', NULL, 'approved', '2024-01-19'),
(11, '黄鹏', '南部中学', '高中', 2010, '高三(1)班', '189****0011', '架构师', '华为', '深圳', '云计算与分布式系统专家。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangpeng', NULL, 'approved', '2024-02-01'),
(12, '林晓燕', '南部中学', '高中', 2010, '高三(2)班', '188****0012', 'UI设计师', '网易', '广州', '专注用户界面设计，热爱艺术。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=linxiaoyan', NULL, 'approved', '2024-02-02'),
(13, '马超', '南部二中', '高中', 2010, '高三(2)班', '187****0013', '律师', '北京大成律师事务所', '北京', '专注商业法律，服务企业合规。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=machao', NULL, 'approved', '2024-02-03'),
(14, '谢雨', '南部三中', '初中', 2008, '初三(1)班', '186****0014', '数据科学家', '百度', '北京', '机器学习与数据挖掘专家。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xieyu', NULL, 'pending', '2024-03-01'),
(15, '冯涛', '大桥中学', '高中', 2012, '高三(3)班', '185****0015', '创业者', '成都某科技公司', '成都', '连续创业者，专注农业科技。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fengtao', NULL, 'pending', '2024-03-02')
ON DUPLICATE KEY UPDATE name = name;

-- 插入资源数据
INSERT INTO resources (id, title, type, description, contact, author, author_id, created_at) VALUES
(1, '成都互联网公司招聘Java工程师', 'job', '我司（成都某上市互联网公司）急招Java后端工程师3名，要求3年以上经验，熟悉Spring Boot，薪资20-35K，欢迎南部老乡投递简历。', '微信: zhangwei_job', '张伟', 12, '2024-11-01'),
(2, '寻找农业科技项目合伙人', 'project', '本人有意在南部县开展智慧农业项目，已有初步方案和部分资金，寻找有农业背景或技术背景的校友合作，共同推动家乡农业现代化。', '电话: 138****0001', '吴杰', NULL, '2024-10-15'),
(3, '天使轮投资机会：乡村旅游项目', 'invest', '南部县乡村旅游项目，依托当地自然资源，已完成商业计划书，寻求50-100万天使轮投资，预计3年回报率150%以上。', '微信: invest_nb', '王磊', NULL, '2024-09-20'),
(4, '南充市区房源出租信息', 'other', '本人在南充市顺庆区有一套120平三室两厅出租，精装修，家电齐全，月租2200元，适合家庭或多人合租，欢迎南部老乡联系。', '电话: 133****0007', '孙浩', NULL, '2024-08-10'),
(5, '深圳科技公司招聘产品经理', 'job', '深圳某知名科技公司招聘高级产品经理，负责移动端产品规划，要求5年以上经验，薪资30-50K+期权，欢迎南部老乡。', '邮箱: hr@example.com', '李娜', NULL, '2024-07-05')
ON DUPLICATE KEY UPDATE title = title;

-- 插入活动数据
INSERT INTO activities (id, name, start_time, end_time, location, capacity, description, organizer_name, organizer_id, created_at) VALUES
(1, '2025年南部县校友春节联谊会', '2025-01-28 18:00:00', '2025-01-28 22:00:00', '南充市嘉陵宾馆', 200, '一年一度的春节校友聚会，共叙同窗情谊，欢迎各届校友携家属参加！', '总管理员', 1, '2024-12-01'),
(2, '校友返乡创业交流会', '2025-03-15 14:00:00', '2025-03-15 17:00:00', '南部县文化中心', 100, '邀请在外创业有成的校友回乡分享经验，探讨返乡创业机遇，助力家乡经济发展。', '总管理员', 1, '2025-01-10'),
(3, '母校捐书公益活动', '2025-04-20 09:00:00', '2025-04-20 12:00:00', '各成员学校', 0, '向母校图书馆捐赠书籍，为在校学生提供更多学习资源。每位参与校友捐赠不少于5本书籍。', '总管理员', 1, '2025-02-01'),
(4, '2024年校友年会（已结束）', '2024-12-20 14:00:00', '2024-12-20 18:00:00', '南充市会展中心', 300, '2024年度校友年会，回顾一年来联盟发展成果，表彰优秀校友。', '总管理员', 1, '2024-11-01')
ON DUPLICATE KEY UPDATE name = name;

-- 插入活动报名数据
INSERT INTO activity_signups (activity_id, user_id, name, avatar, school, signed_at) VALUES
(1, 1, '总管理员', '', '', '2024-12-10 10:00:00'),
(1, 12, '张同学', '', '南部中学', '2024-12-11 14:30:00'),
(4, 1, '总管理员', '', '', '2024-11-10 10:00:00'),
(4, 12, '张同学', '', '南部中学', '2024-11-11 15:00:00'),
(4, 13, '李同学', '', '南部二中', '2024-11-12 09:00:00')
ON DUPLICATE KEY UPDATE activity_id = activity_id;

-- 插入动态数据
INSERT INTO posts (id, content, image, author, author_id, school, avatar, created_at) VALUES
(1, '回到母校南部中学参观，看到崭新的教学楼，感慨万千。希望学弟学妹们好好珍惜在校时光，努力学习！', '', '张伟', 12, '南部中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', '2024-11-15 10:30:00'),
(2, '今天在成都偶遇了南部二中的老同学，真是他乡遇故知！南部人在外要互相帮助，共同进步。', '', '李娜', NULL, '南部中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina', '2024-11-10 15:20:00'),
(3, '南部县的嘉陵江风景真美，每次回家都被家乡的山水所打动。希望家乡越来越好！', '', '孙浩', NULL, '东坝中学', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunhao', '2024-11-05 09:00:00'),
(4, '刚刚参加了校友返乡创业交流会，收获满满！感谢联盟组织这么好的活动，期待更多校友回乡创业，共建家乡！', '', '陈强', NULL, '南部三中', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang', '2024-10-20 16:00:00')
ON DUPLICATE KEY UPDATE content = content;
