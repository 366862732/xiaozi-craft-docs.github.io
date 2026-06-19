# 新建文档条目 PowerShell 脚本
$title = Read-Host "请输入页面标题"
$category = Read-Host "请输入分类目录 (直接回车为根目录)"

if ($title -eq "") {
    Write-Host "标题不能为空！" -ForegroundColor Red
    exit
}

if ($category -eq "") { $category = "." }

$fileName = $title -replace " ", "_"
$projectPath = "D:\xiaozi craft技术文档\xiaozi craft 开发文档"
Set-Location $projectPath

# 创建 MD 文件
$mdPath = Join-Path "docs" $category
New-Item -ItemType Directory -Force -Path $mdPath | Out-Null
$mdFile = Join-Path $mdPath "$fileName.md"
@"
# $title

## 概述

在这里填写概述内容...

## 详细说明

在这里填写详细说明...
"@ | Out-File -Encoding UTF8 $mdFile
Write-Host "✅ 已创建: $mdFile" -ForegroundColor Green

# 创建 HTML 文件
$htmlPath = $category
if ($category -eq ".") { $htmlPath = "." }
New-Item -ItemType Directory -Force -Path $htmlPath | Out-Null
$htmlFile = Join-Path $htmlPath "$fileName.html"
@"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>$title | xiaozi craft</title>
</head>
<body>
    <h1>$title</h1>
    <p>内容待补充...</p>
</body>
</html>
"@ | Out-File -Encoding UTF8 $htmlFile
Write-Host "✅ 已创建: $htmlFile" -ForegroundColor Green

Write-Host ""
Write-Host "✅ 完成！下一步："
Write-Host "1. 编辑 $mdFile"
Write-Host "2. 运行 build.bat 部署"