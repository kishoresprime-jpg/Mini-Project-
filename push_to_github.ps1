$gitCmd = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"
if (-not (Test-Path $gitCmd)) {
    $gitCmd = "git"
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Pushing project to GitHub: kishoresprime-jpg/Mini-Project-" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

& $gitCmd branch -M main
& $gitCmd remote set-url origin https://github.com/kishoresprime-jpg/Mini-Project-.git
& $gitCmd push -u origin main
