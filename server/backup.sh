#!/bin/bash

echo "========================================"
echo "  南部县校友会联盟 - 数据库备份工具"
echo "========================================"
echo ""

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ ! -f "database.sqlite" ]; then
    echo "❌ 错误: 数据库文件不存在"
    exit 1
fi

# 创建备份目录
mkdir -p backups

echo "📦 正在备份数据库..."
cp database.sqlite "backups/database_${TIMESTAMP}.sqlite"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 备份成功！"
    echo "📁 备份文件: backups/database_${TIMESTAMP}.sqlite"
    echo ""
    
    echo "备份历史:"
    ls -lh backups/*.sqlite 2>/dev/null
    
    # 保留最近30天的备份
    echo ""
    echo "清理30天前的备份..."
    find backups -name "database_*.sqlite" -mtime +30 -delete
else
    echo "❌ 备份失败"
    exit 1
fi

echo ""
