# 우리단지토크 - GitHub + Vercel 자동 배포 스크립트
# PowerShell에서 우클릭 → "PowerShell로 실행"

Set-Location $PSScriptRoot
Write-Host "=== 우리단지토크 배포 시작 ===" -ForegroundColor Cyan

# 1. Git 초기화
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Git 초기화 중..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "[1/4] Git 이미 초기화됨" -ForegroundColor Green
}

# 2. GitHub 레포 생성 및 푸시
Write-Host "[2/4] GitHub 레포 생성 및 푸시 중..." -ForegroundColor Yellow
git add .
git commit -m "feat: 우리단지토크 MVP 초기 배포" 2>$null
if ($LASTEXITCODE -ne 0) {
    git commit --allow-empty -m "feat: 우리단지토크 MVP 초기 배포"
}

# gh CLI 확인
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $repoName = "우리단지토크-mvp"
    gh repo create $repoName --public --source=. --remote=origin --push
    Write-Host "GitHub 푸시 완료!" -ForegroundColor Green
} else {
    Write-Host "gh CLI가 없습니다. GitHub Desktop이나 수동으로 레포를 만들어주세요." -ForegroundColor Red
    Write-Host "설치: https://cli.github.com" -ForegroundColor Yellow
    pause
    exit
}

# 3. Vercel CLI 확인 및 배포
Write-Host "[3/4] Vercel 배포 중..." -ForegroundColor Yellow
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    vercel --yes --prod
    Write-Host "[4/4] 배포 완료!" -ForegroundColor Green
} else {
    Write-Host "Vercel CLI 설치 중..." -ForegroundColor Yellow
    npm install -g vercel
    vercel --yes --prod
    Write-Host "[4/4] 배포 완료!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 완료! 위에 표시된 URL로 핸드폰에서 접속하세요 ===" -ForegroundColor Cyan
pause
