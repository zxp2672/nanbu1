@echo off
echo Installing IIS...
powershell -Command "Install-WindowsFeature -Name Web-Server -IncludeManagementTools"

echo.
echo Copying website files...
xcopy /E /I /Y "C:\inetpub\wwwroot\nanbu-alumni\*" "C:\inetpub\wwwroot\"

echo.
echo Starting IIS...
net start W3SVC

echo.
echo ========================================
echo Deployment completed!
echo Please visit: http://47.109.159.143
echo ========================================
pause
