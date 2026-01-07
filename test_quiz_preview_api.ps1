# Test Quiz Preview API Endpoint

Write-Host "=== TEST QUIZ PREVIEW API ===" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:8000/api/ai/generate-quiz-preview"

$testData = @{
    content = "Python là ngôn ngữ lập trình bậc cao, dễ học, dễ sử dụng. Python có cú pháp đơn giản, rõ ràng."
    num_questions = 5
    difficulty = "medium"
    additional_text = "Tập trung vào cú pháp cơ bản và kiểu dữ liệu"
    file_content = "Python hỗ trợ nhiều kiểu dữ liệu: int, str, list, dict, tuple"
} | ConvertTo-Json

Write-Host "Sending request to: $apiUrl" -ForegroundColor Yellow
Write-Host "Request body:" -ForegroundColor Yellow
Write-Host $testData -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $testData -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    Write-Host "Title: $($response.title)" -ForegroundColor White
    Write-Host "Description: $($response.description)" -ForegroundColor White
    Write-Host "Difficulty: $($response.difficulty)" -ForegroundColor White
    Write-Host "Number of questions: $($response.questions.Count)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Questions:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $response.questions.Count; $i++) {
        $q = $response.questions[$i]
        Write-Host ""
        Write-Host "Question $($i + 1): $($q.question)" -ForegroundColor Yellow
        Write-Host "  A. $($q.optionA)" -ForegroundColor White
        Write-Host "  B. $($q.optionB)" -ForegroundColor White
        Write-Host "  C. $($q.optionC)" -ForegroundColor White
        Write-Host "  D. $($q.optionD)" -ForegroundColor White
        Write-Host "  Correct: $($q.correctAnswer)" -ForegroundColor Green
        if ($q.explanation) {
            Write-Host "  Explanation: $($q.explanation)" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "✅ API is working correctly!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Python service is running:" -ForegroundColor Yellow
    Write-Host "  cd backend/PythonService" -ForegroundColor Gray
    Write-Host "  py main.py" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
