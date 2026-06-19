@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo  xiaozi craft - 新建文档条目
echo ========================================
echo.

cd /d "D:\xiaozi craft技术文档"

set /p PAGE_TITLE="请输入页面标题（如：常见问题）: "
set /p PAGE_CATEGORY="请输入分类目录（如：user-guide，直接回车则放在根目录）: "

if "%PAGE_TITLE%"=="" (
    echo 错误：标题不能为空！
    pause
    exit /b
)

if "%PAGE_CATEGORY%"=="" set PAGE_CATEGORY=.

set FILE_NAME=%PAGE_TITLE%
set FILE_NAME=%FILE_NAME: =_%
set FILE_NAME=%FILE_NAME:，=%
set FILE_NAME=%FILE_NAME:。=%

echo.
echo 正在创建...
echo 标题：%PAGE_TITLE%
echo 分类：%PAGE_CATEGORY%
echo.

:: 创建 Markdown 文件
set MD_PATH=docs\%PAGE_CATEGORY%
if not exist "%MD_PATH%" mkdir "%MD_PATH%"

set MD_FILE=%MD_PATH%\%FILE_NAME%.md

(
echo # %PAGE_TITLE%
echo.
echo ## 概述
echo.
echo 在这里填写概述内容...
echo.
echo ## 详细说明
echo.
echo 在这里填写详细说明...
echo.
echo ## 参考资料
echo.
echo - 相关链接1
echo - 相关链接2
) > "%MD_FILE%"

echo [OK] 已创建：%MD_FILE%

:: 创建 HTML 文件
set HTML_PATH=%PAGE_CATEGORY%
if "%PAGE_CATEGORY%"=="." set HTML_PATH=.

if not exist "%HTML_PATH%" mkdir "%HTML_PATH%"

set HTML_FILE=%HTML_PATH%\%FILE_NAME%.html

(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>%PAGE_TITLE% ^| xiaozi craft技术文档^</title^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>%PAGE_TITLE%^</h1^>
echo     ^<p^>内容待补充...^</p^>
echo ^</body^>
echo ^</html^>
) > "%HTML_FILE%"

echo [OK] 已创建：%HTML_FILE%

echo.
echo ========================================
echo  完成！
echo ========================================
echo.
echo 下一步：
echo 1. 编辑内容：%MD_FILE%
echo 2. 运行 build.bat 部署
echo.
pause