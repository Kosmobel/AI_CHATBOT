########################
# Educational Chatbot  #
# Project Launcher     #
########################

# === настраиваемые переменные ==========================
$frontendDir          = "FRONTEND"        # новая папка фронтенда
$backendDir           = "nodejs_backend"  # новая папка бэкенда
$frontendStartCommand = "start"           # npm start (CRA)
$backendStartCommand  = "node server.js"  # или "start", если в package.json прописан
$projectName          = "Educational Chatbot"
$frontendURL          = "http://localhost:3000"
$backendURL           = "http://localhost:3001"
# =======================================================

Write-Host "$projectName Launcher" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta

# Проверяем, что скрипт запущен из корня проекта
if (-not (Test-Path $frontendDir) -or -not (Test-Path $backendDir)) {
    Write-Host "Error: Script must be run from the project root directory!" -ForegroundColor Red
    Write-Host "Make sure '$frontendDir' and '$backendDir' folders exist here" -ForegroundColor Yellow
    exit 1
}

function Install-Dependencies {
    param ($folder, $name)

    Write-Host "Installing dependencies for $name..." -ForegroundColor DarkCyan
    Push-Location $folder
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "$name dependencies installed!" -ForegroundColor Green
        } else {
            Write-Host "Error installing $name dependencies" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } catch {
        Write-Host "npm install failed for ${name}: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        return $false
    }
    Pop-Location
    return $true
}

function Start-Server {
    param ($folder, $name, $command)

    Write-Host "Starting $name..." -ForegroundColor DarkCyan
    Push-Location $folder
    try {
        # Запускаем в новом окне PowerShell
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $command -WindowStyle Normal
        Write-Host "$name started in new window!" -ForegroundColor Green
    } catch {
        Write-Host "Error starting ${name}: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        return $false
    }
    Pop-Location
    return $true
}

Write-Host "1. Installing dependencies..." -ForegroundColor Cyan
if (-not (Install-Dependencies $backendDir "Backend")) { exit 1 }
if (-not (Install-Dependencies $frontendDir "Frontend")) { exit 1 }
Write-Host "All dependencies installed!" -ForegroundColor Green

Write-Host ""
Write-Host "2. Starting servers..." -ForegroundColor Cyan
if (-not (Start-Server $backendDir "Backend Server" $backendStartCommand)) { exit 1 }
Start-Sleep -Seconds 2
if (-not (Start-Server $frontendDir "Frontend Server" "npm $frontendStartCommand")) { exit 1 }

Write-Host ""
Write-Host "$projectName started successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Frontend: $frontendURL" -ForegroundColor Magenta
Write-Host "Backend : $backendURL" -ForegroundColor Magenta
Write-Host ""
Write-Host "Close the opened PowerShell windows or press Ctrl+C inside them to stop the servers." -ForegroundColor Yellow
