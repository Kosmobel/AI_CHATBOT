
Set-Location -Path $PSScriptRoot

& ".\venv\Scripts\Activate.ps1"

python voice_rec_service.py

Read-Host "Нажмите Enter чтобы выйти"
