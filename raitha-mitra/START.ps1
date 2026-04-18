# Raitha Mitra - PowerShell Startup Script
# Right-click → "Run with PowerShell" OR run: .\START.ps1

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  RAITHA MITRA - Setup & Start" -ForegroundColor Green  
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot

# Step 1: Root deps
Write-Host "[1/4] Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Root install failed" -ForegroundColor Red; pause; exit 1 }

# Step 2: Server deps
Write-Host "[2/4] Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Server install failed" -ForegroundColor Red; pause; exit 1 }
Set-Location ..

# Step 3: Client deps
Write-Host "[3/4] Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Client install failed" -ForegroundColor Red; pause; exit 1 }
Set-Location ..

# Step 4: Start both servers in separate windows
Write-Host "[4/4] Starting servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend  -> http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server'; npm run dev" -WindowStyle Normal
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\client'; npm start" -WindowStyle Normal

Write-Host "Both servers starting in separate windows." -ForegroundColor Green
Write-Host "Frontend will open in your browser automatically." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit this window"
