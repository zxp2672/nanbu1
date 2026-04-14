#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 用于在服务器上生成500个校友数据和管理员账号
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 真实年轻头像URL（来自Unsplash）
const avatars = [
  // 女生头像 (20个)
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1521119989659-a83eee488058?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1523264653568-d4503264ae95?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&h=150&fit=crop&crop=face',
  // 男生头像 (20个)
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506792006437-256b665541e2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506422748879-887454f9cdff?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
];

// 姓氏
const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const names1 = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平'];
const names2 = ['刚', '勇', '燕', '玲', '桂英', '芳', '萍', '华', '飞', '兰', '霞', '明', '杰', '斌', '涛', '敏', '强', '丽', '娜', '秀英'];

// 学校数据
const schools = [
  { name: '南部中学', levels: ['高中'], years: [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012], classes: ['高三(1)班', '高三(2)班', '高三(3)班', '高三(4)班', '高三(5)班'] },
  { name: '南部二中', levels: ['高中', '初中'], years: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012], classes: ['高三(1)班', '高三(2)班', '初三(1)班', '初三(2)班'] },
  { name: '南部三中', levels: ['高中'], years: [2006, 2007, 2008, 2009, 2010], classes: ['高三(1)班', '高三(2)班', '高三(3)班'] },
  { name: '大桥中学', levels: ['高中', '初中'], years: [2007, 2008, 2009, 2010, 2011], classes: ['高三(1)班', '高三(2)班', '初三(1)班'] },
  { name: '东坝中学', levels: ['高中'], years: [2005, 2006, 2007, 2008], classes: ['高三(1)班', '高三(2)班'] },
  { name: '建兴中学', levels: ['初中'], years: [2008, 2009, 2010, 2011, 2012], classes: ['初三(1)班', '初三(2)班'] }
];

const jobs = ['软件工程师', '产品经理', '教师', '医生', '律师', '公务员', '企业家', '设计师', '会计师', '销售', '工程师', '研究员', '公务员', '护士', '会计师'];
const companies = ['腾讯', '阿里巴巴', '华为', '百度', '字节跳动', '美团', '京东', '网易', '小米', '比亚迪', '格力', '海尔', '中国移动', '中国电信', '银行', '医院', '学校'];
const cities = ['北京', '上海', '深圳', '广州', '成都', '重庆', '杭州', '南京', '武汉', '西安', '南充', '南部', '重庆', '绵阳'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  const gender = Math.random() > 0.5;
  if (gender) {
    return randomFrom(surnames) + randomFrom(names1) + (Math.random() > 0.5 ? randomFrom(names2) : '');
  } else {
    return randomFrom(surnames) + randomFrom(names2) + (Math.random() > 0.5 ? randomFrom(names1) : '');
  }
}

async function initDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('开始初始化数据库...');
      
      // 检查是否已有数据
      const count = await new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as count FROM alumni', (err, row) => {
          if (err) rej(err);
          else res(row.count);
        });
      });
      
      if (count > 100) {
        console.log(`数据库已有 ${count} 个校友，跳过初始化`);
        resolve();
        return;
      }
      
      console.log('创建管理员账号...');
      
      const hash = await bcrypt.hash('123456', 10);
      
      // 插入管理员
      const admins = [
        ['u0', 'admin', hash, '总管理员', 'superadmin', '', '', '', '', '系统管理员', '南充', '南部县校友会联盟总管理员', ''],
        ['u_nb1', 'nb1_admin', hash, '南部中学管理员', 'school_admin', '南部中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_nb2', 'nb2_admin', hash, '南部二中管理员', 'school_admin', '南部二中', '', '', '', '学校管理员', '南充', '', ''],
        ['u_nb3', 'nb3_admin', hash, '南部三中管理员', 'school_admin', '南部三中', '', '', '', '学校管理员', '南充', '', ''],
        ['u_dq', 'dq_admin', hash, '大桥中学管理员', 'school_admin', '大桥中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_db', 'db_admin', hash, '东坝中学管理员', 'school_admin', '东坝中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_jx', 'jx_admin', hash, '建兴中学管理员', 'school_admin', '建兴中学', '', '', '', '学校管理员', '南充', '', ''],
        ['u_nb1_2005_1', 'nb1_2005_1', hash, '南部中学2005级1班管理员', 'class_admin', '南部中学', '高中', 2005, '高三(1)班', '班级管理员', '南充', '', ''],
        ['u_nb1_2010_2', 'nb1_2010_2', hash, '南部中学2010级2班管理员', 'class_admin', '南部中学', '高中', 2010, '高三(2)班', '班级管理员', '南充', '', ''],
        ['u2', 'user', hash, '张同学', 'user', '南部中学', '高中', 2010, '高三(2)班', '软件工程师', '成都', '', ''],
      ];
      
      for (const user of admins) {
        await new Promise((res, rej) => {
          db.run(
            `INSERT OR IGNORE INTO users (id, username, password, name, role, school, level, year, classname, job, city, bio, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            user,
            (err) => err ? rej(err) : res()
          );
        });
      }
      
      console.log('生成500个校友数据...');
      
      for (let i = 0; i < 500; i++) {
        const school = randomFrom(schools);
        const level = randomFrom(school.levels);
        const year = randomFrom(school.years);
        const classname = randomFrom(school.classes);
        const avatar = randomFrom(avatars);
        
        const alumni = [
          `a_gen_${i + 1}`,
          randomName(),
          school.name,
          level,
          year,
          classname,
          `13${Math.floor(Math.random() * 900000000 + 100000000)}${Math.floor(Math.random() * 10)}`,
          randomFrom(jobs),
          randomFrom(companies),
          randomFrom(cities),
          '热爱生活，关注家乡发展',
          avatar,
          '',
          Math.random() > 0.1 ? 'approved' : 'pending',
          new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ];
        
        await new Promise((res, rej) => {
          db.run(
            `INSERT OR IGNORE INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            alumni,
            (err) => err ? rej(err) : res()
          );
        });
        
        if ((i + 1) % 50 === 0) {
          console.log(`已生成 ${i + 1}/500 个校友`);
        }
      }
      
      console.log('✅ 数据库初始化完成！');
      console.log(`   - 管理员账号: ${admins.length} 个`);
      console.log(`   - 校友数据: 500 个`);
      
      resolve();
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      reject(error);
    } finally {
      db.close();
    }
  });
}

initDatabase().then(() => {
  console.log('脚本执行完成');
  process.exit(0);
}).catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
