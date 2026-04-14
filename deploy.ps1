# 南部校友网站部署脚本
# 在Windows服务器上运行此脚本

# 创建网站目录
$sitePath = "C:\inetpub\wwwroot\nanbu-alumni"
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath -Force
    Write-Host "创建网站目录: $sitePath"
}

# 注意：此脚本需要在服务器上运行
# 并通过远程桌面或其他方式将文件传输到服务器后执行

Write-Host "部署脚本已准备就绪"
Write-Host "请将项目文件复制到: $sitePath"
Write-Host "然后在IIS中创建新的网站指向该目录"
