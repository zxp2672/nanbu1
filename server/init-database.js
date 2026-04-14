#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 生成200个校友、20个资源、20场活动
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const avatarSeeds = ['zhangwei','lina','wanglei','liufang','chenqiang','zhaomin','sunhao','zhouting','wujie','zhengxue','huangpeng','linxiaoyan','machao','xieyu','fengtao','liuyang','wangfang','zhangjie','liqiang','zhaolei','sunmin','zhouwei','wugang','zhengyan','liuling','wangchao','chenbin','zhangtao','lixia','zhaopeng'];

const surnames = ['张','王','李','赵','刘','陈','杨','黄','吴','周','徐','孙','马','朱','胡','郭','何','高','林','罗','冯','谢','唐','韩','曹','许','邓','萧','冯','曾'];
const givenNames = ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','军','杰','娟','涛','明','超','霞','平','刚','燕','玲','华','飞','兰','斌','鹏','婷','雪','浩','晨','宇','欣','雨','阳','帆','博','睿','颖','慧','琳'];

const schools = [
  { name: '南部中学', levels: ['高中'], years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012], classes: ['高三(1)班','高三(2)班','高三(3)班','高三(4)班','高三(5)班'] },
  { name: '南部二中', levels: ['高中','初中'], years: [2005,2006,2007,2008,2009,2010,2011,2012], classes: ['高三(1)班','高三(2)班','初三(1)班','初三(2)班'] },
  { name: '南部三中', levels: ['高中'], years: [2006,2007,2008,2009,2010], classes: ['高三(1)班','高三(2)班','高三(3)班'] },
  { name: '大桥中学', levels: ['高中','初中'], years: [2007,2008,2009,2010,2011], classes: ['高三(1)班','高三(2)班','初三(1)班'] },
  { name: '东坝中学', levels: ['高中'], years: [2005,2006,2007,2008], classes: ['高三(1)班','高三(2)班'] },
  { name: '建兴中学', levels: ['初中'], years: [2008,2009,2010,2011,2012], classes: ['初三(1)班','初三(2)班'] }
];

const jobs = ['软件工程师','产品经理','教师','医生','律师','公务员','企业家','设计师','会计师','销售经理','机械工程师','研究员','护士','财务总监','市场总监','人力资源','运营总监','数据分析师','架构师','CTO'];
const companies = ['腾讯科技','阿里巴巴','华为技术','百度','字节跳动','美团','京东','网易','小米','比亚迪','格力电器','海尔集团','中国移动','招商银行','南充市中心医院','西南大学','四川日报','南部县政府','成都某科技公司','北京大成律师事务所'];
const cities = ['北京','上海','深圳','广州','成都','重庆','杭州','南京','武汉','西安','南充','绵阳','宜宾','泸州','达州','遂宁','广安','巴中','雅安','眉山'];
const bios = [
  '热爱生活，关注家乡发展。',
  '专注本职工作，努力回报社会。',
  '南部走出来的游子，心系故乡。',
  '感恩母校培育，不忘初心前行。',
  '在外打拼多年，希望为家乡做贡献。',
  '校友情谊深厚，期待与大家共叙同窗情。',
  '立足本职，服务社会，回馈家乡。',
  '人在他乡，心系南部，常回家看看。',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randName() {
  const s = pick(surnames);
  const g1 = pick(givenNames);
  const g2 = Math.random() > 0.4 ? pick(givenNames) : '';
  return s + g1 + g2;
}
function randDate(daysAgo) {
  return new Date(Date.now() - Math.random() * daysAgo * 86400000).toISOString().split('T')[0];
}
function randPhone() {
  return `1${pick(['3','5','7','8','9'])}${String(Math.floor(Math.random()*900000000+100000000))}`;
}

// 20个资源数据
const resourcesData = [
  { type:'job', title:'成都互联网公司招聘Java工程师', desc:'我司（成都某上市互联网公司）急招Java后端工程师3名，要求3年以上经验，熟悉Spring Boot/微服务，薪资20-35K，欢迎南部老乡投递简历。', contact:'微信: zhangwei_job', author:'张伟' },
  { type:'job', title:'深圳科技公司招聘产品经理', desc:'深圳某知名科技公司招聘高级产品经理，负责移动端产品规划，要求5年以上经验，薪资30-50K+期权，欢迎南部老乡。', contact:'邮箱: hr@example.com', author:'李娜' },
  { type:'job', title:'北京AI公司招聘算法工程师', desc:'字节跳动旗下AI团队招聘算法工程师，熟悉深度学习/NLP，硕士及以上学历，薪资40-80K，提供住房补贴。', contact:'微信: ai_recruit', author:'郑雪' },
  { type:'job', title:'华为成都研究所招聘嵌入式工程师', desc:'华为成都研究所招聘嵌入式软件工程师，要求熟悉Linux内核/驱动开发，3年以上经验，薪资25-45K。', contact:'电话: 028-8888****', author:'黄鹏' },
  { type:'job', title:'南充市医院招聘临床医生', desc:'南充市中心医院招聘心内科、骨科、儿科医生各2名，要求本科及以上学历，有执业医师资格证，欢迎回乡就业。', contact:'电话: 0817-2222****', author:'孙浩' },
  { type:'project', title:'寻找农业科技项目合伙人', desc:'本人有意在南部县开展智慧农业项目，已有初步方案和部分资金，寻找有农业背景或技术背景的校友合作，共同推动家乡农业现代化。', contact:'电话: 138****0001', author:'吴杰' },
  { type:'project', title:'乡村民宿项目寻合伙人', desc:'南部县嘉陵江沿岸民宿项目，已选址完毕，寻找有旅游/酒店管理经验的校友合作，预计投资100万，3年回本。', contact:'微信: minsu_nb', author:'赵敏' },
  { type:'project', title:'校友电商平台建设', desc:'计划搭建南部县特产电商平台，销售本地农产品、特色食品，寻找有电商运营经验的校友参与，共同推广家乡好物。', contact:'微信: nb_shop', author:'陈强' },
  { type:'project', title:'南部县文旅IP开发项目', desc:'依托南部县历史文化资源，开发文旅IP产品，寻找有设计/文创/营销背景的校友合作，共同打造南部文化品牌。', contact:'邮箱: wenlu@nb.com', author:'周婷' },
  { type:'project', title:'校友互助基金筹建', desc:'拟成立南部县校友互助基金，为在校贫困学生提供助学金，寻找有公益经验的校友共同参与管理，欢迎联系。', contact:'微信: nb_fund', author:'王磊' },
  { type:'invest', title:'天使轮投资机会：乡村旅游项目', desc:'南部县乡村旅游项目，依托当地自然资源，已完成商业计划书，寻求50-100万天使轮投资，预计3年回报率150%以上。', contact:'微信: invest_nb', author:'王磊' },
  { type:'invest', title:'新能源汽车配件厂投资机会', desc:'南部县工业园区新能源汽车配件项目，已获政府支持，寻求200-500万A轮投资，有意向者请联系。', contact:'电话: 139****0088', author:'陈强' },
  { type:'invest', title:'教育培训机构加盟机会', desc:'成熟的K12教育培训品牌在南充地区寻求加盟合作，初始投资50-80万，总部提供全套运营支持。', contact:'微信: edu_join', author:'赵敏' },
  { type:'invest', title:'农村电商仓储物流项目', desc:'南部县农村电商仓储物流项目，已有稳定客户，寻求100万投资扩大规模，年化收益预计20%以上。', contact:'电话: 135****0066', author:'吴杰' },
  { type:'other', title:'南充市区房源出租信息', desc:'本人在南充市顺庆区有一套120平三室两厅出租，精装修，家电齐全，月租2200元，适合家庭或多人合租，欢迎南部老乡联系。', contact:'电话: 133****0007', author:'孙浩' },
  { type:'other', title:'成都二手车转让', desc:'本人因出国工作，转让2021年大众帕萨特一辆，行驶3万公里，车况良好，售价13万，欢迎南部老乡优先。', contact:'微信: car_sell_nb', author:'马超' },
  { type:'other', title:'法律咨询服务', desc:'本人为执业律师，专注商业合同、劳动纠纷、房产交易等领域，为南部校友提供免费初次法律咨询，欢迎联系。', contact:'微信: lawyer_nb', author:'马超' },
  { type:'other', title:'会计/税务咨询服务', desc:'CPA持证，提供企业财务规划、税务筹划、审计等服务，为南部校友创业企业提供优惠价格，欢迎咨询。', contact:'电话: 136****0004', author:'刘芳' },
  { type:'job', title:'广州外贸公司招聘业务员', desc:'广州某外贸公司招聘外贸业务员2名，有英语基础优先，底薪+提成，月收入8000-20000，包住，欢迎应届生。', contact:'微信: trade_gz', author:'林晓燕' },
  { type:'project', title:'南部县特色餐饮连锁项目', desc:'计划在成都、重庆开设南部县特色餐饮连锁店，主打南部本地特色菜，寻找有餐饮经验或资金的校友合作。', contact:'微信: nb_food', author:'谢雨' },
];

// 20场活动数据
const activitiesData = [
  { name:'2025年南部县校友春节联谊会', startTime:'2025-01-28T18:00', endTime:'2025-01-28T22:00', location:'南充市嘉陵宾馆大宴会厅', desc:'一年一度的春节校友聚会，共叙同窗情谊，欢迎各届校友携家属参加！现场设有抽奖、文艺表演等环节。', capacity:200 },
  { name:'校友返乡创业交流会', startTime:'2025-03-15T14:00', endTime:'2025-03-15T17:00', location:'南部县文化中心', desc:'邀请在外创业有成的校友回乡分享经验，探讨返乡创业机遇，助力家乡经济发展。', capacity:100 },
  { name:'母校捐书公益活动', startTime:'2025-04-20T09:00', endTime:'2025-04-20T12:00', location:'各成员学校', desc:'向母校图书馆捐赠书籍，为在校学生提供更多学习资源。每位参与校友捐赠不少于5本书籍。', capacity:0 },
  { name:'南部县校友高尔夫友谊赛', startTime:'2025-05-10T08:00', endTime:'2025-05-10T17:00', location:'南充国际高尔夫球场', desc:'首届南部县校友高尔夫友谊赛，以球会友，增进感情。报名费500元/人，含午餐及球场费用。', capacity:40 },
  { name:'2025年校友子女升学指导讲座', startTime:'2025-06-01T14:00', endTime:'2025-06-01T17:00', location:'南部县教育局报告厅', desc:'邀请在教育领域工作的校友分享升学经验，为校友子女提供高考志愿填报、留学申请等指导。', capacity:150 },
  { name:'校友企业参观交流活动', startTime:'2025-06-20T09:00', endTime:'2025-06-20T16:00', location:'成都高新区', desc:'组织参观校友创办的优秀企业，了解行业发展动态，促进校友间的商业合作。', capacity:30 },
  { name:'南部县校友篮球友谊赛', startTime:'2025-07-05T09:00', endTime:'2025-07-05T18:00', location:'南部县体育馆', desc:'各学校校友篮球队友谊赛，以体育精神增进校友情谊。欢迎各学校组队参赛，每队5-8人。', capacity:80 },
  { name:'暑期校友子女夏令营', startTime:'2025-07-15T08:00', endTime:'2025-07-20T18:00', location:'南部县嘉陵江风景区', desc:'为校友子女举办5天4夜夏令营，包含户外拓展、文化体验、安全教育等活动，费用1500元/人。', capacity:50 },
  { name:'校友读书会（第一期）', startTime:'2025-08-10T15:00', endTime:'2025-08-10T17:30', location:'南充市图书馆', desc:'本期主题：《人生的智慧》，欢迎爱好读书的校友参加，共同分享读书心得，拓展思维视野。', capacity:30 },
  { name:'2025年中秋校友茶话会', startTime:'2025-09-06T15:00', endTime:'2025-09-06T18:00', location:'南部县茶文化中心', desc:'中秋佳节，邀请在南充及南部的校友共聚一堂，品茶赏月，共叙乡情。', capacity:60 },
  { name:'校友职业发展沙龙', startTime:'2025-09-20T14:00', endTime:'2025-09-20T17:00', location:'成都天府新区某咖啡厅', desc:'面向在成都工作的校友，分享职场经验、行业动态，促进校友间的职业发展互助。', capacity:40 },
  { name:'南部县校友马拉松', startTime:'2025-10-12T07:00', endTime:'2025-10-12T12:00', location:'南部县嘉陵江滨江路', desc:'首届南部县校友马拉松，设全程、半程、5公里健康跑三个组别，报名费100元，含纪念T恤和完赛奖牌。', capacity:500 },
  { name:'校友公益助学金颁发典礼', startTime:'2025-10-25T10:00', endTime:'2025-10-25T12:00', location:'南部中学礼堂', desc:'向品学兼优的贫困在校生颁发校友助学金，共计20名学生获奖，每人5000元，欢迎校友出席见证。', capacity:200 },
  { name:'校友摄影展', startTime:'2025-11-01T09:00', endTime:'2025-11-30T18:00', location:'南部县文化馆', desc:'展出校友拍摄的南部县风光、人文、历史照片，为期一个月，欢迎投稿参展，免费向公众开放。', capacity:0 },
  { name:'2025年校友年会', startTime:'2025-12-20T14:00', endTime:'2025-12-20T21:00', location:'南充市会展中心', desc:'2025年度校友年会，回顾一年来联盟发展成果，表彰优秀校友，共同展望未来。晚宴+文艺演出。', capacity:300 },
  { name:'新春校友联谊（北京场）', startTime:'2025-02-08T18:00', endTime:'2025-02-08T21:00', location:'北京朝阳区某餐厅', desc:'在京南部校友新春聚会，叙旧情、话发展，欢迎在北京的校友参加。', capacity:50 },
  { name:'新春校友联谊（上海场）', startTime:'2025-02-09T18:00', endTime:'2025-02-09T21:00', location:'上海浦东新区某餐厅', desc:'在沪南部校友新春聚会，共叙同窗情谊，欢迎在上海的校友参加。', capacity:50 },
  { name:'新春校友联谊（深圳场）', startTime:'2025-02-10T18:00', endTime:'2025-02-10T21:00', location:'深圳南山区某餐厅', desc:'在深南部校友新春聚会，以乡情为纽带，共谋发展，欢迎在深圳的校友参加。', capacity:50 },
  { name:'校友读书会（第二期）', startTime:'2025-11-15T15:00', endTime:'2025-11-15T17:30', location:'南充市图书馆', desc:'本期主题：《置身事内：中国政府与经济发展》，欢迎爱好读书的校友参加，共同探讨中国经济发展。', capacity:30 },
  { name:'2024年校友年会（已结束）', startTime:'2024-12-20T14:00', endTime:'2024-12-20T18:00', location:'南充市会展中心', desc:'2024年度校友年会，回顾一年来联盟发展成果，表彰优秀校友。', capacity:300 },
];

function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, err => err ? rej(err) : res()));
}
function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
}

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');

    // 检查校友数量
    const alumniCount = await get('SELECT COUNT(*) as count FROM alumni');
    if (alumniCount.count >= 200) {
      console.log(`数据库已有 ${alumniCount.count} 个校友，跳过校友初始化`);
    } else {
      console.log('创建管理员账号...');
      const hash = await bcrypt.hash('123456', 10);
      const admins = [
        ['u0','admin',hash,'总管理员','superadmin','','','','','系统管理员','南充','南部县校友会联盟总管理员',''],
        ['u_nb1','nb1_admin',hash,'南部中学管理员','school_admin','南部中学','','','','学校管理员','南充','',''],
        ['u_nb2','nb2_admin',hash,'南部二中管理员','school_admin','南部二中','','','','学校管理员','南充','',''],
        ['u_nb3','nb3_admin',hash,'南部三中管理员','school_admin','南部三中','','','','学校管理员','南充','',''],
        ['u_dq','dq_admin',hash,'大桥中学管理员','school_admin','大桥中学','','','','学校管理员','南充','',''],
        ['u_db','db_admin',hash,'东坝中学管理员','school_admin','东坝中学','','','','学校管理员','南充','',''],
        ['u_jx','jx_admin',hash,'建兴中学管理员','school_admin','建兴中学','','','','学校管理员','南充','',''],
        ['u_nb1_2005_1','nb1_2005_1',hash,'南部中学2005级1班管理员','class_admin','南部中学','高中',2005,'高三(1)班','班级管理员','南充','',''],
        ['u_nb1_2010_2','nb1_2010_2',hash,'南部中学2010级2班管理员','class_admin','南部中学','高中',2010,'高三(2)班','班级管理员','南充','',''],
        ['u2','user',hash,'张同学','user','南部中学','高中',2010,'高三(2)班','软件工程师','成都','',''],
      ];
      for (const u of admins) {
        await run(`INSERT OR IGNORE INTO users (id,username,password,name,role,school,level,year,classname,job,city,bio,avatar) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, u);
      }

      console.log('生成200个校友数据...');
      for (let i = 0; i < 200; i++) {
        const school = pick(schools);
        const level = pick(school.levels);
        const year = pick(school.years);
        const classname = pick(school.classes);
        const seed = pick(avatarSeeds);
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}_${i}`;
        await run(
          `INSERT OR IGNORE INTO alumni (id,name,school,level,year,classname,phone,job,company,city,bio,avatar,user_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [`a_gen_${i+1}`, randName(), school.name, level, year, classname, randPhone(), pick(jobs), pick(companies), pick(cities), pick(bios), avatar, '', Math.random()>0.1?'approved':'pending', randDate(180)]
        );
        if ((i+1) % 50 === 0) console.log(`  校友 ${i+1}/200`);
      }
    }

    // 检查资源数量
    const resCount = await get('SELECT COUNT(*) as count FROM resources');
    if (resCount.count >= 20) {
      console.log(`数据库已有 ${resCount.count} 个资源，跳过`);
    } else {
      console.log('生成20个资源数据...');
      for (let i = 0; i < resourcesData.length; i++) {
        const r = resourcesData[i];
        await run(
          `INSERT OR IGNORE INTO resources (id,title,type,description,contact,author,author_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
          [`r_demo_${i+1}`, r.title, r.type, r.desc, r.contact, r.author, 'u0', 'active', randDate(120)]
        );
      }
      console.log('  资源数据生成完成');
    }

    // 检查活动数量
    const actCount = await get('SELECT COUNT(*) as count FROM activities');
    if (actCount.count >= 20) {
      console.log(`数据库已有 ${actCount.count} 个活动，跳过`);
    } else {
      console.log('生成20场活动数据...');
      for (let i = 0; i < activitiesData.length; i++) {
        const a = activitiesData[i];
        await run(
          `INSERT OR IGNORE INTO activities (id,name,start_time,end_time,location,description,capacity,organizer_id,organizer_name,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [`act_demo_${i+1}`, a.name, a.startTime, a.endTime||'', a.location, a.desc, a.capacity, 'u0', '总管理员', randDate(60)]
        );
      }
      console.log('  活动数据生成完成');
    }

    console.log('\n✅ 数据库初始化完成！');
    console.log('   - 校友: 200 个');
    console.log('   - 资源: 20 个');
    console.log('   - 活动: 20 场');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initDatabase().then(() => process.exit(0));
