@echo off
chcp 65001 >nul

echo ========================================
echo  正在构建和部署...
echo ========================================

cd /d "D:\xiaozi craft技术文档"

echo.
echo [1/4] 构建文档...
call npm run docs:build
if errorlevel 1 (
    echo 构建失败！
    pause
    exit /b
)

echo.
echo [2/4] 复制文件到根目录...
xcopy "docs\.vitepress\dist\*" "." /E /Y

echo.
echo [3/4] 添加文件到 Git...
git add .

echo.
echo [4/4] 提交并推送...
git commit -m "更新文档"
git push

echo.
echo ========================================
echo  部署完成！
echo ========================================
echo.
echo 访问：https://366862732.github.io/xiaozi-craft-docs.github.io/
echo.
pause