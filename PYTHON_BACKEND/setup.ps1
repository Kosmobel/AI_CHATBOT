Write-Host "Educational Chatbot Python Backend Setup" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

$services = @("LLM_SERVICE", "VOICE_SERVICE")

foreach ($service in $services) {
    Write-Host "`nProcessing $service..." -ForegroundColor Cyan
    $servicePath = Join-Path -Path $PSScriptRoot -ChildPath $service
    $venvPath = Join-Path -Path $servicePath -ChildPath "venv"
    $requirementsPath = Join-Path -Path $servicePath -ChildPath "requirements.txt"

    if (-Not (Test-Path $servicePath)) {
        Write-Host "Directory not found: $service" -ForegroundColor Red
        continue
    }

    if (-Not (Test-Path $venvPath)) {
        Write-Host "Creating virtual environment in $service..." -ForegroundColor DarkCyan
        Push-Location $servicePath
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create virtual environment in $service" -ForegroundColor Red
            Pop-Location
            continue
        }
        Pop-Location
        Write-Host "Virtual environment created in $service!" -ForegroundColor Green
    } else {
        Write-Host "Virtual environment already exists in $service" -ForegroundColor Yellow
    }



    
    if (Test-Path $requirementsPath) {
        Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor DarkCyan
        $activateScript = Join-Path -Path $venvPath -ChildPath "Scripts\Activate.ps1"

        $installCommand = "& `"$activateScript`"; pip install -r `"$requirementsPath`""
        Invoke-Expression $installCommand

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed for $service!" -ForegroundColor Green
        } else {
            Write-Host "Error installing dependencies for $service" -ForegroundColor Red
        }
    } else {
        Write-Host "requirements.txt not found in $service" -ForegroundColor Yellow
    }
}

Write-Host "`nSetup completed for all services!" -ForegroundColor Green
