# 检查IIS是否安装
$iisInstalled = Get-WindowsFeature -Name "Web-Server" -ErrorAction SilentlyContinue

if ($iisInstalled.Installed) {
    Write-Host "IIS已安装"
    
    # 检查默认网站是否存在
    $defaultSite = Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    
    if ($defaultSite) {
        Write-Host "默认网站已存在，物理路径: $($defaultSite.PhysicalPath)"
        
        # 将nanbu-alumni文件复制到默认网站根目录
        $sourcePath = "C:\inetpub\wwwroot\nanbu-alumni"
        $destPath = "C:\inetpub\wwwroot"
        
        Copy-Item -Path "$sourcePath\*" -Destination $destPath -Recurse -Force
        Write-Host "文件已复制到默认网站根目录"
    }
    
    # 重启IIS服务
    Restart-Service W3SVC
    Write-Host "IIS服务已重启"
    
    # 检查网站绑定
    Get-WebsiteBinding
} else {
    Write-Host "IIS未安装，正在安装IIS..."
    
    # 安装IIS
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
    
    Write-Host "IIS安装完成"
    
    # 将nanbu-alumni文件复制到默认网站根目录
    $sourcePath = "C:\inetpub\wwwroot\nanbu-alumni"
    $destPath = "C:\inetpub\wwwroot"
    
    Copy-Item -Path "$sourcePath\*" -Destination $destPath -Recurse -Force
    Write-Host "文件已复制到默认网站根目录"
    
    # 启动IIS服务
    Start-Service W3SVC
    Write-Host "IIS服务已启动"
}

Write-Host "`n部署完成！"
Write-Host "请访问: http://47.109.159.143"
