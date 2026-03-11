# auto-pull.ps1 — Tự động chạy git pull mỗi 1 phút
# Cách dùng: click chuột phải > "Run with PowerShell"
#            hoặc chạy: powershell -ExecutionPolicy Bypass -File auto-pull.ps1

$repoPath = $PSScriptRoot   # thư mục chứa script này (root của repo)

Write-Host "=== Auto Git Pull ===" -ForegroundColor Cyan
Write-Host "Repo : $repoPath"
Write-Host "Chu ky: 60 giay  |  Nhan Ctrl+C de dung"
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] git pull..." -NoNewline

    $result = git -C $repoPath pull 2>&1
    $trimmed = ($result | Out-String).Trim()

    if ($trimmed -eq "Already up to date.") {
        Write-Host " Khong co gi moi." -ForegroundColor DarkGray
    } else {
        Write-Host ""
        Write-Host $trimmed -ForegroundColor Green
    }

    Start-Sleep -Seconds 60
}
