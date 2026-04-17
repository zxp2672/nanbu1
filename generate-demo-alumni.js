#!/usr/bin/env node
/**
 * 生成演示校友数据
 * 每个学校: 3个年级 × 4个班 × 5人 = 60人
 * 总计: 6个学校 × 60人 = 360人
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const avatarSeeds = ['zhangwei','lina','wanglei','liufang','chenqiang','zhaomin','sunhao','zhouting','wujie','zhengxue'];

const surnames = ['张','王','李','赵','刘','陈','杨','黄','吴','周','徐','孙','马','朱','胡','郭','何','高','林','罗'];
const givenNames = ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','军','杰','娟','涛','明','超','霞','平','刚','燕'];

const schools = [
  { name: '南部中学', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] },
  { name: '南部二中', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] },
  { name: '南部三中', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] },
  { name: '大桥中学', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] },
  { name: '东坝中学', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] },
  { name: '建兴中学', level: '高中', years: [2020, 2019, 2018], classes: ['1', '2', '3', '4'] }
];

const jobs = ['软件工程师','产品经理','教师','医生','律师','公务员','企业家','设计师','会计师','销售经理'];
const companies = ['腾讯科技','阿里巴巴','华为技术','百度','字节跳动','美团','京东','网易','小米','比亚迪'];
const cities = ['北京','上海','深圳','广州','成都','重庆','杭州','南京','武汉','西安','南充'];
const bios = [
  '热爱生活，关注家乡发展。',
  '专注本职工作，努力回报社会。',
  '南部走出来的游子，心系故乡。',
  '感恩母校培育，不忘初心前行。',
  '在外打拼多年，希望为家乡做贡献。',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randName() {
  const s = pick(surnames);
  const g1 = pick(givenNames);
  const g2 = Math.random() > 0.4 ? pick(givenNames) : '';
  return s + g1 + g2;
}
function randPhone() {
  return `1${pick(['3','5','7','8','9'])}${String(Math.floor(Math.random()*900000000+100000000))}`;
}
function randDate(daysAgo) {
  return new Date(Date.now() - Math.random() * daysAgo * 86400000).toISOString().split('T')[0];
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function generateData() {
  try {
    console.log('开始生成演示数据...\n');

    // 先清理现有虚拟校友
    console.log('清理现有虚拟校友...');
    await run(`DELETE FROM alumni WHERE user_id = '' OR user_id IS NULL`);
    console.log('清理完成\n');

    let count = 0;
    
    for (const school of schools) {
      console.log(`生成 ${school.name} 数据...`);
      
      for (const year of school.years) {
        for (const classname of school.classes) {
          // 每个班级生成5个校友
          for (let i = 0; i < 5; i++) {
            const seed = pick(avatarSeeds);
            const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}_${count}`;
            
            await run(
              `INSERT INTO alumni (id, name, school, level, year, classname, phone, job, company, city, bio, avatar, user_id, status, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `a_demo_${count}`,
                randName(),
                school.name,
                school.level,
                year,
                classname,
                randPhone(),
                pick(jobs),
                pick(companies),
                pick(cities),
                pick(bios),
                avatar,
                '',
                'approved',
                randDate(180)
              ]
            );
            count++;
          }
        }
      }
      
      console.log(`  ${school.name}: ${school.years.length * school.classes.length * 5} 人`);
    }
    
    console.log(`\n✅ 数据生成完成！`);
    console.log(`   总计: ${count} 个校友`);
    console.log(`   每个学校: ${schools[0].years.length * schools[0].classes.length * 5} 人`);
    console.log(`   每个年级: ${schools[0].classes.length * 5} 人`);
    console.log(`   每个班级: 5 人`);

  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

generateData().then(() => process.exit(0));
