@echo off
chcp 65001 >nul
echo ======================================
echo  南部县校友会 - 一键推送到 GitHub
echo ======================================
echo.

cd /d e:\ai\clode\nanbu1

:: 检查是否有改动
git status --short > tmp_status.txt
for %%A in (tmp_status.txt) do if %%~zA==0 (
    del tmp_status.txt
    echo [!] 没有需要提交的改动
    pause
    exit /b 0
)
del tmp_status.txt

:: 显示改动文件
echo [*] 改动文件:
git status --short
echo.

:: 输入提交信息
set /p MSG=请输入提交说明 (直接回车使用默认): 
if "%MSG%"=="" set MSG=update

:: 提交并推送
echo.
echo [*] 提交中...
git add -A
git commit -m "%MSG%"

echo [*] 推送到 GitHub...
git push origin main

if %errorlevel%==0 (
    echo.
    echo [√] 推送成功！服务器将在几秒内自动部署。
    echo     查看部署日志: ssh root@47.109.159.143 "tail -f /var/log/nanbu-deploy.log"
) else (
    echo.
    echo [×] 推送失败，请检查网络连接。
)

echo.
pause
