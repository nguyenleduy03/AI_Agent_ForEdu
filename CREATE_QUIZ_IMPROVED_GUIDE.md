# 🎯 HƯỚNG DẪN CẢI TIẾN TRANG TẠO QUIZ

## ✅ ĐÃ LÊN KẾ HOẠCH

File: `QUIZ_IMPROVEMENT_PLAN.md`

## 🔧 CẦN LÀM

### 1. Backend - Python Service

Thêm endpoint mới trong `main.py`:

```python
@app.post("/api/quiz/generate-preview")
async def generate_quiz_preview(
    lesson_id: int,
    difficulty: str,
    num_questions: int,
    additional_text: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Generate quiz preview (không save vào DB)
    Trả về JSON để frontend hiển thị preview
    """
    # Get lesson content
    lesson = get_lesson_from_spring_boot(lesson_id)
    
    # Combine content
    content = lesson['content']
    if additional_text:
        content += f"\n\n{additional_text}"
    
    # Generate quiz with AI
    quiz_data = generate_quiz_with_ai(content, difficulty, num_questions)
    
    return {
        "title": f"Quiz - {lesson['title']}",
        "description": f"AI generated quiz with {num_questions} questions",
        "difficulty": difficulty.upper(),
        "questions": quiz_data
    }
```

### 2. Frontend - Quiz Service

Thêm function mới trong `quizService.ts`:

```typescript
generateQuizPreview: async (data: {
  lessonId: number;
  difficulty: string;
  numQuestions: number;
  additionalText?: string;
}): Promise<QuizPreview> => {
  const response = await fastApi.post('/api/quiz/generate-preview', data);
  return response.data;
},
```

### 3. Frontend - CreateQuizPage

**Tạo file mới**: `fronend_web/src/pages/CreateQuizPageImproved.tsx`

Hoặc thay thế file hiện tại với code cải tiến.

---

## 📝 CODE SNIPPETS

### AI Config Section (với text & file upload)

```typescript
{/* AI Mode - Step 1: Configuration */}
{step === 'config' && (
  <div className="space-y-6">
    {/* Số câu hỏi & Độ khó */}
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <label>Số lượng câu hỏi</label>
        <input
          type="number"
          value={aiNumQuestions}
          onChange={(e) => setAiNumQuestions(parseInt(e.target.value))}
        />
      </div>
      <div>
        <label>Độ khó</label>
        <select
          value={aiDifficulty}
          onChange={(e) => setAiDifficulty(e.target.value)}
        >
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
      </div>
    </div>

    {/* Text bổ sung */}
    <div>
      <label>📝 Text bổ sung (optional)</label>
      <textarea
        value={additionalText}
        onChange={(e) => setAdditionalText(e.target.value)}
        placeholder="Nhập thêm nội dung để AI tham khảo khi tạo câu hỏi..."
        rows={6}
      />
      <p className="text-sm text-gray-500 mt-1">
        VD: Tập trung vào phần X, Y, Z hoặc thêm ví dụ cụ thể
      </p>
    </div>

    {/* File upload */}
    <div>
      <label>📎 Tài liệu bổ sung (optional)</label>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
      />
      {uploadedFile && (
        <div className="mt-2 flex items-center gap-2">
          <span>📄 {uploadedFile.name}</span>
          <button onClick={() => setUploadedFile(null)}>❌</button>
        </div>
      )}
    </div>

    {/* Generate button */}
    <button
      onClick={handleGeneratePreview}
      disabled={generating}
    >
      {generating ? 'AI đang tạo...' : '🤖 Để AI tạo quiz'}
    </button>
  </div>
)}
```

### Preview Section (với edit & delete)

```typescript
{/* AI Mode - Step 2: Preview & Edit */}
{step === 'preview' && previewQuiz && (
  <div className="space-y-6">
    {/* Quiz Info (editable) */}
    <div>
      <label>Tiêu đề</label>
      <input
        value={previewQuiz.title}
        onChange={(e) => setPreviewQuiz({
          ...previewQuiz,
          title: e.target.value
        })}
      />
    </div>

    {/* Questions List */}
    {previewQuiz.questions.map((q, index) => (
      <div key={index} className="border rounded-lg p-4">
        {editingQuestionIndex === index ? (
          // Edit Mode
          <QuestionEditForm
            question={q}
            onSave={(updated) => saveEditedQuestion(index, updated)}
            onCancel={() => setEditingQuestionIndex(null)}
          />
        ) : (
          // View Mode
          <div>
            <div className="flex justify-between">
              <h3>Câu {index + 1}: {q.question}</h3>
              <div className="flex gap-2">
                <button onClick={() => setEditingQuestionIndex(index)}>
                  ✏️ Edit
                </button>
                <button onClick={() => deleteQuestion(index)}>
                  🗑️ Xóa
                </button>
              </div>
            </div>
            <div className="mt-2">
              <div>A. {q.optionA} {q.correctAnswer === 'A' && '✓'}</div>
              <div>B. {q.optionB} {q.correctAnswer === 'B' && '✓'}</div>
              <div>C. {q.optionC} {q.correctAnswer === 'C' && '✓'}</div>
              <div>D. {q.optionD} {q.correctAnswer === 'D' && '✓'}</div>
            </div>
          </div>
        )}
      </div>
    ))}

    {/* Add Question Button */}
    <button onClick={addNewQuestion}>
      + Thêm câu hỏi
    </button>

    {/* Action Buttons */}
    <div className="flex gap-4">
      <button onClick={() => setStep('config')}>
        ← Quay lại
      </button>
      <button onClick={handleGeneratePreview}>
        🔄 Tạo lại
      </button>
      <button onClick={saveFinalQuiz}>
        💾 Lưu bài kiểm tra
      </button>
    </div>
  </div>
)}
```

---

## 🎯 IMPLEMENTATION STEPS

### Bước 1: Backend
```bash
cd backend/PythonService
# Thêm endpoint generate-preview vào main.py
# Test: curl -X POST http://localhost:8000/api/quiz/generate-preview
```

### Bước 2: Frontend Service
```bash
cd fronend_web/src/services
# Update quizService.ts
```

### Bước 3: Frontend Page
```bash
cd fronend_web/src/pages
# Tạo CreateQuizPageImproved.tsx
# Hoặc update CreateQuizPage.tsx
```

### Bước 4: Test
```
1. Login as teacher
2. Vào lesson
3. Click "Tạo quiz"
4. Chọn AI mode
5. Nhập text bổ sung
6. Upload file (optional)
7. Click "Để AI tạo"
8. Review & edit
9. Save
```

---

## 📊 EXPECTED RESULT

### Before
```
AI tạo → Save ngay → Không thể review
```

### After
```
AI tạo → Preview → Edit → Save
         ↓
    Có thể chỉnh sửa
    Có thể xóa câu
    Có thể thêm câu
    Có thể tạo lại
```

---

**Bạn muốn tôi tạo code đầy đủ ngay không?**

Tôi có thể tạo:
1. ✅ Backend endpoint mới
2. ✅ Frontend service update
3. ✅ CreateQuizPageImproved.tsx đầy đủ
4. ✅ QuestionEditForm component

**Chỉ cần xác nhận là tôi sẽ tạo ngay!** 🚀
