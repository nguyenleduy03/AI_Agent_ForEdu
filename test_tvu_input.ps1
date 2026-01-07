# Test TVU Schedule - Manual Input

Write-Host "=== TEST TVU SCHEDULE ===" -ForegroundColor Cyan
Write-Host ""

# Get credentials
Write-Host "Enter your TVU credentials:" -ForegroundColor Yellow
$mssv = Read-Host "MSSV"
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Testing TVU login and schedule..." -ForegroundColor Yellow
Write-Host ""

# Test endpoint
$testUrl = "http://localhost:8000/api/test/tvu-schedule"

$testData = @{
    mssv = $mssv
    password = $passwordPlain
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $testUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 30
    
    if ($response.success) {
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host $response.message -ForegroundColor White
        Write-Host ""
        
        if ($response.schedules -and $response.schedules.Count -gt 0) {
            Write-Host "Found $($response.schedules.Count) classes:" -ForegroundColor Cyan
            Write-Host ""
            
            foreach ($schedule in $response.schedules) {
                $dayMap = @{
                    'MONDAY' = 'Thu 2'
                    'TUESDAY' = 'Thu 3'
                    'WEDNESDAY' = 'Thu 4'
                    'THURSDAY' = 'Thu 5'
                    'FRIDAY' = 'Thu 6'
                    'SATURDAY' = 'Thu 7'
                    'SUNDAY' = 'Chu nhat'
                }
                
                $day = $dayMap[$schedule.day_of_week]
                $time = "$($schedule.start_time.Substring(0,5)) - $($schedule.end_time.Substring(0,5))"
                
                Write-Host "$day | $time" -ForegroundColor Yellow
                Write-Host "  Mon: $($schedule.subject)" -ForegroundColor White
                Write-Host "  Phong: $($schedule.room)" -ForegroundColor White
                if ($schedule.teacher) {
                    Write-Host "  GV: $($schedule.teacher)" -ForegroundColor White
                }
                Write-Host ""
            }
            
            Write-Host "Total: $($response.schedules.Count) classes" -ForegroundColor Green
        } else {
            Write-Host "No classes found this week" -ForegroundColor Yellow
            Write-Host "This may be normal if:" -ForegroundColor Gray
            Write-Host "- It's holiday/break time" -ForegroundColor Gray
            Write-Host "- Current week has no scheduled classes" -ForegroundColor Gray
        }
        
    } else {
        Write-Host "FAILED!" -ForegroundColor Red
        Write-Host $response.message -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "Unable to connect") {
        Write-Host "Python service is not running!" -ForegroundColor Yellow
        Write-Host "Start it with:" -ForegroundColor Yellow
        Write-Host "  cd backend/PythonService" -ForegroundColor Gray
        Write-Host "  py main.py" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Cyan
