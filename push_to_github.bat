@echo off
cd /d "%~dp0"
echo ===================================================
echo Pushing project to https://github.com/kishoresprime-jpg/Mini-Project-.git
echo ===================================================
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"
git branch -M main
git remote set-url origin https://github.com/kishoresprime-jpg/Mini-Project-.git
git push -u origin main
pause
