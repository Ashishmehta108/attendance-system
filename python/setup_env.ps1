Write-Host "Setting up backend environment..."

# 1. Create venv if not exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# 2. Install dependencies
Write-Host "Installing dependencies..."
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. Create models directory
if (-not (Test-Path "models")) {
    New-Item -ItemType Directory -Force -Path "models"
}

Write-Host "Environment setup complete."
