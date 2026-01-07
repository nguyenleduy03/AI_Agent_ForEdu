# 📝 CẢI TIẾN TRANG TẠO QUIZ

## 🎯 YÊU CẦU

### 1. Thêm Text/Tài Liệu Bổ Sung cho AI
- ✅ Textarea để nhập text bổ sung
- ✅ Upload file (PDF, DOC, TXT) để AI đọc
- ✅ AI sẽ dựa vào: Nội dung bài học + Text bổ sung + File upload

### 2. Preview Quiz Trước Khi Save
- ✅ Sau khi AI tạo → Hiển thị preview
- ✅ Giáo viên xem tất cả câu hỏi
- ✅ Có thể chỉnh sửa từng câu
- ✅ Có thể xóa câu không phù hợp
- ✅ Có thể thêm câu mới
- ✅ Sau khi review xong → Click "Save" để lưu

### 3. Chỉnh Sửa Câu Hỏi
- ✅ Edit question text
- ✅ Edit options A, B, C, D
- ✅ Change correct answer
- ✅ Add/edit explanation

---

## 🔄 FLOW MỚI

### Manual Mode (Không đổi)
```
1. Nhập thông tin quiz
2. Thêm câu hỏi thủ công
3. Click "Tạo bài kiểm tra"
4. Save ngay
```

### AI Mode (CẢI TIẾN)
```
1. Chọn số câu hỏi & độ khó
2. (MỚI) Thêm text bổ sung (optional)
3. (MỚI) Upload file bổ sung (optional)
4. Click "Để AI tạo quiz"
5. (MỚI) AI tạo → Hiển thị PREVIEW
6. (MỚI) Giáo viên review & chỉnh sửa
7. (MỚI) Click "Lưu bài kiểm tra" → Save
```

---

## 🎨 UI DESIGN

### Step 1: AI Configuration
```
┌─────────────────────────────────────────────────────┐
│ 🤖 AI Tự động tạo câu hỏi                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Số câu hỏi: [10]    Độ khó: [Trung bình ▼]       │
│                                                     │
│ 📝 Text bổ sung (optional):                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ Nhập thêm nội dung để AI tham khảo...      │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 📎 Tài liệu bổ sung (optional):                    │
│ [📄 Upload File] hoặc kéo thả file vào đây        │
│                                                     │
│ Đã upload: document.pdf (2.5 MB) [x]              │
│                                                     │
│ [Hủy]  [🤖 Để AI tạo quiz]                        │
└─────────────────────────────────────────────────────┘
```

### Step 2: Preview & Edit
```
┌─────────────────────────────────────────────────────┐
│ ✨ AI đã tạo 10 câu hỏi - Xem lại và chỉnh sửa    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tiêu đề: [Kiểm tra kiến thức...]                  │
│ Mô tả: [AI đã tạo tự động...]                      │
│ Độ khó: [Trung bình ▼]                            │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Câu 1: Python là gì?                [Edit]  │   │
│ │ A. Ngôn ngữ lập trình          ✓ Đúng      │   │
│ │ B. Con rắn                                  │   │
│ │ C. Framework                                │   │
│ │ D. Database                                 │   │
│ │                                    [Xóa]    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Câu 2: ...                         [Edit]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [+ Thêm câu hỏi]                                   │
│                                                     │
│ [Hủy]  [Tạo lại]  [💾 Lưu bài kiểm tra]          │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION

### 1. Backend API Changes

**Endpoint mới: Generate Quiz with Preview**
```
POST /api/quiz/generate-preview
Body: {
  lessonId: number,
  difficulty: string,
  numQuestions: number,
  additionalText?: string,
  fileContent?: string
}

Response: {
  title: string,
  description: string,
  difficulty: string,
  questions: [
    {
      question: string,
      optionA: string,
      optionB: string,
      optionC: string,
      optionD: string,
      correctAnswer: string,
      explanation?: string
    }
  ]
}
```

**Endpoint hiện tại vẫn giữ nguyên:**
```
POST /api/quiz/create
```

### 2. Frontend Components

**New States:**
```typescript
const [step, setStep] = useState<'config' | 'preview'>('config');
const [additionalText, setAdditionalText] = useState('');
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [previewQuiz, setPreviewQuiz] = useState<any>(null);
const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
```

**New Functions:**
```typescript
// Generate preview
const generatePreview = async () => {
  const response = await quizService.generateQuizPreview({
    lessonId,
    difficulty,
    numQuestions,
    additionalText,
    fileContent: await readFileContent(uploadedFile)
  });
  setPreviewQuiz(response);
  setStep('preview');
};

// Edit question
const editQuestion = (index: number) => {
  setEditingQuestionIndex(index);
};

// Save edited question
const saveEditedQuestion = (index: number, updatedQuestion: any) => {
  const updated = [...previewQuiz.questions];
  updated[index] = updatedQuestion;
  setPreviewQuiz({ ...previewQuiz, questions: updated });
  setEditingQuestionIndex(null);
};

// Delete question
const deleteQuestion = (index: number) => {
  const updated = previewQuiz.questions.filter((_, i) => i !== index);
  setPreviewQuiz({ ...previewQuiz, questions: updated });
};

// Final save
const saveFinalQuiz = async () => {
  await quizService.createQuiz({
    lessonId,
    title: previewQuiz.title,
    description: previewQuiz.description,
    difficulty: previewQuiz.difficulty,
    questions: previewQuiz.questions
  });
  navigate(`/lessons/${lessonId}`);
};
```

---

## 📊 BENEFITS

### Cho Giáo Viên
- ✅ Tiết kiệm thời gian với AI
- ✅ Kiểm soát chất lượng câu hỏi
- ✅ Tùy chỉnh theo nhu cầu
- ✅ Thêm context cho AI tạo chính xác hơn

### Cho Sinh Viên
- ✅ Câu hỏi chất lượng cao
- ✅ Phù hợp với nội dung học
- ✅ Độ khó phù hợp

---

## 🚀 NEXT STEPS

1. ✅ Tạo file CreateQuizPageImproved.tsx
2. ✅ Update quizService.ts với API mới
3. ✅ Test flow hoàn chỉnh
4. ✅ Deploy

---

**Tạo**: 2026-01-07  
**Status**: 📝 PLANNING  
**Priority**: HIGH
