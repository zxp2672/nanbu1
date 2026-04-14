@echo off
chcp 65001 >nul
echo ========================================
echo   南部县校友会联盟 - 数据库备份工具
echo ========================================
echo.

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist database.sqlite (
    echo ❌ 错误: 数据库文件不存在
    pause
    exit /b 1
)

echo 📦 正在备份数据库...
copy database.sqlite "backups\database_%TIMESTAMP%.sqlite" >nul

if %errorlevel% equ 0 (
    echo.
    echo ✅ 备份成功！
    echo 📁 备份文件: backups\database_%TIMESTAMP%.sqlite
    echo.
    
    echo 备份历史:
    dir /b backups\*.sqlite 2>nul | find /c ".sqlite" >nul
    if %errorlevel% equ 0 (
        dir /b /o-d backups\*.sqlite 2>nul
    )
) else (
    echo ❌ 备份失败
    if not exist backups mkdir backups
    copy database.sqlite "backups\database_%TIMESTAMP%.sqlite"
)

echo.
pause
