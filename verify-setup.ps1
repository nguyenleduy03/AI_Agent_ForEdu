# ============================================
# VERIFY ENVIRONMENT SETUP
# ============================================

Write-Host "KIEM TRA SETUP MOI TRUONG..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# ============================================
# 1. CHECK PYTHON SERVICE .ENV
# ============================================
Write-Host "1. Kiem tra Python Service .env..." -ForegroundColor Yellow
$pythonEnv = "backend\PythonService\.env"

if (Test-Path $pythonEnv) {
    Write-Host "   OK File ton tai: $pythonEnv" -ForegroundColor Green
    
    $content = Get-Content $pythonEnv -Raw
    
    # Check required keys
    $requiredKeys = @(
        "GEMINI_API_KEY",
        "GROQ_API_KEY",
        "GOOGLE_OAUTH_CLIENT_ID",
        "GOOGLE_OAUTH_CLIENT_SECRET",
        "ENCRYPTION_KEY"
    )
    
    foreach ($key in $requiredKeys) {
        if ($content -match "$key=.+") {
            Write-Host "   OK $key" -ForegroundColor Green
        } else {
            Write-Host "   X $key - THIEU!" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   X File khong ton tai: $pythonEnv" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# ============================================
# 2. CHECK FRONTEND .ENV
# ============================================
Write-Host "2. Kiem tra Frontend .env..." -ForegroundColor Yellow
$frontendEnv = "fronend_web\.env"

if (Test-Path $frontendEnv) {
    Write-Host "   OK File ton tai: $frontendEnv" -ForegroundColor Green
    
    $content = Get-Content $frontendEnv -Raw
    
    $requiredKeys = @(
        "VITE_API_URL",
        "VITE_FASTAPI_URL",
        "VITE_GOOGLE_CLIENT_ID"
    )
    
    foreach ($key in $requiredKeys) {
        if ($content -match "$key=.+") {
            Write-Host "   OK $key" -ForegroundColor Green
        } else {
            Write-Host "   X $key - THIEU!" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   X File khong ton tai: $frontendEnv" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# ============================================
# 3. CHECK SPRING BOOT APPLICATION.YAML
# ============================================
Write-Host "3. Kiem tra Spring Boot application.yaml..." -ForegroundColor Yellow
$springYaml = "backend\SpringService\agentforedu\src\main\resources\application.yaml"

if (Test-Path $springYaml) {
    Write-Host "   OK File ton tai: $springYaml" -ForegroundColor Green
    
    $content = Get-Content $springYaml -Raw
    
    if ($content -match "jwt:\s+secret:") {
        Write-Host "   OK JWT Secret configured" -ForegroundColor Green
    } else {
        Write-Host "   X JWT Secret - THIEU!" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($content -match "datasource:\s+url:") {
        Write-Host "   OK Database URL configured" -ForegroundColor Green
    } else {
        Write-Host "   X Database URL - THIEU!" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   X File khong ton tai: $springYaml" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# ============================================
# 4. CHECK MYSQL
# ============================================
Write-Host "4. Kiem tra MySQL..." -ForegroundColor Yellow

$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue

if ($mysqlService) {
    if ($mysqlService.Status -eq "Running") {
        Write-Host "   OK MySQL dang chay" -ForegroundColor Green
    } else {
        Write-Host "   ! MySQL khong chay - Can start: net start MySQL80" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "   X MySQL chua cai dat" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# ============================================
# 5. CHECK NODE_MODULES
# ============================================
Write-Host "5. Kiem tra Frontend dependencies..." -ForegroundColor Yellow

if (Test-Path "fronend_web\node_modules") {
    Write-Host "   OK node_modules da cai dat" -ForegroundColor Green
} else {
    Write-Host "   ! node_modules chua cai - Can chay: cd fronend_web && npm install" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# SUMMARY
# ============================================
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "TAT CA DA SAN SANG!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ban co the chay du an bang:" -ForegroundColor White
    Write-Host "   .\start-fullstack.ps1" -ForegroundColor Cyan
} else {
    Write-Host "CO MOT SO VAN DE CAN KHAC PHUC" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Vui long doc: SETUP_ENVIRONMENT_GUIDE.md" -ForegroundColor White
}

Write-Host "========================================" -ForegroundColor Cyan
