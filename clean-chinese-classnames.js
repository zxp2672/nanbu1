#!/usr/bin/env node
/**
 * 清理中文班级名称
 * 将 "高三(1)班" 等中文格式转换为 "1" 等数字格式
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function cleanClassNames() {
  try {
    console.log('开始清理中文班级名称...\n');

    // 获取所有不同的班级名称
    const classNames = await all("SELECT DISTINCT classname FROM alumni");
    
    console.log(`找到 ${classNames.length} 种班级名称：`);
    classNames.forEach(cn => console.log(`  - ${cn.classname}`));
    console.log('');

    let updatedCount = 0;

    // 转换规则：高三(1)班 -> 1, 高三(2)班 -> 2, 等等
    for (const cn of classNames) {
      const oldName = cn.classname;
      
      // 提取括号中的数字
      const match = oldName.match(/\((\d+)\)/);
      if (match) {
        const newName = match[1]; // 提取数字部分
        
        // 更新数据库
        const result = await run(
          "UPDATE alumni SET classname = ? WHERE classname = ?",
          [newName, oldName]
        );
        
        updatedCount += result.changes;
        console.log(`✓ "${oldName}" -> "${newName}" (${result.changes} 条记录)`);
      } else {
        console.log(`- "${oldName}" 无需转换`);
      }
    }

    console.log(`\n✅ 清理完成！共更新 ${updatedCount} 条记录`);

    // 验证结果
    const newClassNames = await all("SELECT DISTINCT classname FROM alumni ORDER BY classname");
    console.log('\n清理后的班级名称：');
    newClassNames.forEach((cn, index) => {
      console.log(`  ${index + 1}. ${cn.classname}`);
    });

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

cleanClassNames().then(() => process.exit(0));
