# Test TVU Schedule API Directly

Write-Host "=== TEST TVU SCHEDULE DIRECTLY ===" -ForegroundColor Cyan
Write-Host ""

$mssv = "110122061"
$password = "Duy@2003"

Write-Host "Testing with MSSV: $mssv" -ForegroundColor Yellow
Write-Host ""

# Test endpoint
$testUrl = "http://localhost:8000/api/test/tvu-schedule"

$testData = @{
    mssv = $mssv
    password = $password
} | ConvertTo-Json

Write-Host "Calling TVU API..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $testUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 30
    
    if ($response.success) {
        Write-Host ""
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Message: $($response.message)" -ForegroundColor White
        Write-Host ""
        
        if ($response.schedules -and $response.schedules.Count -gt 0) {
            Write-Host "Found $($response.schedules.Count) classes:" -ForegroundColor Cyan
            Write-Host ""
            
            foreach ($schedule in $response.schedules) {
                $day = $schedule.day_of_week
                $time = "$($schedule.start_time) - $($schedule.end_time)"
                $subject = $schedule.subject
                $room = $schedule.room
                $teacher = $schedule.teacher
                
                Write-Host "Day: $day" -ForegroundColor Yellow
                Write-Host "  Time: $time" -ForegroundColor White
                Write-Host "  Subject: $subject" -ForegroundColor White
                Write-Host "  Room: $room" -ForegroundColor White
                if ($teacher) {
                    Write-Host "  Teacher: $teacher" -ForegroundColor White
                }
                Write-Host ""
            }
        } else {
            Write-Host "No schedules found (may be no classes this week)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "FAILED!" -ForegroundColor Red
        Write-Host "Message: $($response.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host ""
            Write-Host "Response:" -ForegroundColor Yellow
            Write-Host $responseBody -ForegroundColor Gray
        } catch {}
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
