/**
 * 管理员API路由
 * 包含：全局统计、管理员管理、数据审核等功能
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authenticateToken, error, success } = require('./auth');

// 全局统计数据（管理员权限）
router.get('/stats', authenticateToken, (req, res, db) => {
    // 检查权限
    if (!['superadmin', 'school_admin', 'class_admin'].includes(req.user.role)) {
        return res.status(403).json(error('权限不足'));
    }
    
    const stats = {};
    let whereClause = '';
    const params = [];
    
    // 根据角色限制数据范围
    if (req.user.role === 'school_admin') {
        whereClause = `WHERE school = '${req.user.school}'`;
    } else if (req.user.role === 'class_admin') {
        whereClause = `WHERE school = '${req.user.school}' AND year = ${req.user.year} AND classname = '${req.user.classname}'`;
    }
    
    // 校友统计
    db.all(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM alumni ${whereClause}
    `, params, (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        stats.alumni = rows[0];
        
        // 学校分布
        db.all(`SELECT school, COUNT(*) as count FROM alumni ${whereClause} GROUP BY school ORDER BY count DESC`, [], (err, rows) => {
            stats.schools = rows;
            
            // 年份分布
            db.all(`SELECT year, COUNT(*) as count FROM alumni ${whereClause} AND year IS NOT NULL GROUP BY year ORDER BY year DESC`, [], (err, rows) => {
                stats.years = rows;
                
                // 城市分布
                db.all(`SELECT city, COUNT(*) as count FROM alumni ${whereClause} AND city IS NOT NULL AND city != '' GROUP BY city ORDER BY count DESC LIMIT 10`, [], (err, rows) => {
                    stats.cities = rows;
                    
                    // 职业分布
                    db.all(`SELECT job, COUNT(*) as count FROM alumni ${whereClause} AND job IS NOT NULL AND job != '' GROUP BY job ORDER BY count DESC LIMIT 10`, [], (err, rows) => {
                        stats.jobs = rows;
                        
                        res.json(success(stats));
                    });
                });
            });
        });
    });
});

// 获取所有管理员列表（总管理员权限）
router.get('/users', authenticateToken, (req, res, db) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足'));
    }
    
    db.all('SELECT id, username, name, role, school, level, year, classname, city, created_at FROM users WHERE role != "user" ORDER BY role, school, year', [], (err, rows) => {
        if (err) return res.status(500).json(error('服务器错误'));
        res.json(success(rows));
    });
});

// 创建管理员（总管理员权限）
router.post('/users', authenticateToken, (req, res, db) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足'));
    }
    
    const { username, password, name, role, school, level, year, classname, city } = req.body;
    
    if (!username || !password || !name || !role) {
        return res.status(400).json(error('必填字段缺失'));
    }
    
    // 检查用户名是否已存在
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (row) {
            return res.status(400).json(error('用户名已存在'));
        }
        
        const id = 'u_' + Date.now();
        const hash = bcrypt.hashSync(password, 10);
        
        db.run(
            `INSERT INTO users (id, username, password, name, role, school, level, year, classname, job, city, bio, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, '', '')`,
            [id, username, hash, name, role, school || '', level || '', year || '', classname || '', city || ''],
            function(err) {
                if (err) return res.status(500).json(error('创建失败'));
                db.get('SELECT id, username, name, role, school, level, year, classname, city FROM users WHERE id = ?', [id], (err, row) => {
                    res.json(success(row));
                });
            }
        );
    });
});

// 删除管理员（总管理员权限）
router.delete('/users/:id', authenticateToken, (req, res, db) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json(error('权限不足'));
    }
    
    // 不能删除自己
    if (req.params.id === req.user.id) {
        return res.status(400).json(error('不能删除自己'));
    }
    
    db.run('DELETE FROM users WHERE id = ? AND role != "superadmin"', [req.params.id], function(err) {
        if (err) return res.status(500).json(error('删除失败'));
        if (this.changes === 0) {
            return res.status(404).json(error('用户不存在或不能删除'));
        }
        res.json(success(null));
    });
});

module.exports = (db) => {
    // 注入db实例到所有路由
    router.use((req, res, next) => {
        req.db = db;
        next();
    });
    return router;
};
