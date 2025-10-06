
Set-Location -Path $PSScriptRoot

& ".\venv\Scripts\Activate.ps1"


python llm_service.py

Read-Host "Нажмите Enter чтобы выйти"
