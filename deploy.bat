@echo off
REM 南部县校友会联盟 - Windows部署脚本
REM 目标服务器: 47.109.159.143
REM 域名: xy1.001tf.com

echo ======================================
echo 南部县校友会联盟 - 部署脚本
echo ======================================
echo.

set REMOTE_USER=root
set REMOTE_HOST=47.109.159.143
set REMOTE_DIR=/opt/nanbu-alumni
set PROJECT_NAME=nanbu1

echo [1/6] 检查本地文件...
if not exist "server\server.js" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)
echo √ 本地文件检查通过
echo.

echo [2/6] 打包项目文件...
REM 使用Git Bash的tar命令
bash -c "cd .. && tar -czf /tmp/%PROJECT_NAME%.tar.gz --exclude='node_modules' --exclude='.git' --exclude='*.sqlite' --exclude='backend' --exclude='nginx-1.29.8' --exclude='*.png' --exclude='.DS_Store' %PROJECT_NAME%/"
echo √ 项目打包完成
echo.

echo [3/6] 上传到服务器...
ssh %REMOTE_USER%@%REMOTE_HOST% "mkdir -p %REMOTE_DIR%"
scp /tmp/%PROJECT_NAME%.tar.gz %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
echo √ 文件上传完成
echo.

echo [4/6] 在服务器上解压和安装...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && tar -xzf %PROJECT_NAME%.tar.gz && cd %PROJECT_NAME%/server && npm install --production && mkdir -p data && chmod +x start.sh backup.sh"
echo √ 服务器安装完成
echo.

echo [5/6] 配置Nginx...
ssh %REMOTE_USER%@%REMOTE_HOST% "bash -s" < deploy-nginx.sh
echo √ Nginx配置完成
echo.

echo [6/6] 启动应用...
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR%/%PROJECT_NAME%/server && pm2 delete %PROJECT_NAME% 2>/dev/null || true && pm2 start server.js --name %PROJECT_NAME% --env production && pm2 save && pm2 startup"
echo √ 应用启动完成
echo.

echo ======================================
echo √ 部署完成！
echo ======================================
echo.
echo 访问地址:
echo   - HTTP: http://xy1.001tf.com
echo   - 服务器: http://47.109.159.143:3000
echo.
echo 管理命令:
echo   - 查看日志: ssh root@47.109.159.143 "pm2 logs %PROJECT_NAME%"
echo   - 重启服务: ssh root@47.109.159.143 "pm2 restart %PROJECT_NAME%"
echo   - 查看状态: ssh root@47.109.159.143 "pm2 status"
echo.
echo 注意: 请确保域名 xy1.001tf.com 已解析到 47.109.159.143
echo.
pause
