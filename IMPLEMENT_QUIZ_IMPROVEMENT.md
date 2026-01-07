# 🚀 IMPLEMENT QUIZ IMPROVEMENT - HƯỚNG DẪN

## ✅ ĐÃ BACKUP

File gốc đã được backup: `CreateQuizPage.backup.tsx`

---

## 📝 CẦN THÊM VÀO CODE

### 1. Thêm States Mới

Trong `CreateQuizPage.tsx`, thêm các states sau:

```typescript
// Thêm vào sau các state hiện tại
const [step, setStep] = useState<'config' | 'preview'>('config');
const [additionalText, setAdditionalText] = useState('');
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [previewQuiz, setPreviewQuiz] = useState<any>(null);
const [editingIndex, setEditingIndex] = useState<number | null>(null);
const [generating, setGenerating] = useState(false);
```

### 2. Thêm Handler Functions

```typescript
// Handle file upload
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type
    const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error('Chỉ hỗ trợ file PDF, DOC, DOCX, TXT');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File không được vượt quá 10MB');
      return;
    }
    
    setUploadedFile(file);
    toast.success(`Đã chọn file: ${file.name}`);
  }
};

// Generate preview with AI
const handleGeneratePreview = async () => {
  if (aiNumQuestions < 1 || aiNumQuestions > 50) {
    toast.error('Số câu hỏi phải từ 1 đến 50');
    return;
  }
  
  setGenerating(true);
  
  try {
    // Read file content if uploaded
    let fileContent = '';
    if (uploadedFile) {
      fileContent = await readFileAsText(uploadedFile);
    }
    
    // Call AI to generate quiz (sẽ tạo API này)
    const response = await fetch('http://localhost:8000/api/quiz/generate-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonIdNum,
        difficulty: aiDifficulty,
        num_questions: aiNumQuestions,
        additional_text: additionalText || undefined,
        file_content: fileContent || undefined,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to generate');
    
    const data = await response.json();
    setPreviewQuiz(data);
    setStep('preview');
    toast.success('AI đã tạo xong! Hãy xem lại và chỉnh sửa');
  } catch (error) {
    toast.error('Không thể tạo quiz. Vui lòng thử lại');
    console.error(error);
  } finally {
    setGenerating(false);
  }
};

// Read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Edit question
const handleEditQuestion = (index: number) => {
  setEditingIndex(index);
};

// Save edited question
const handleSaveEdit = (index: number, updated: any) => {
  const newQuestions = [...previewQuiz.questions];
  newQuestions[index] = updated;
  setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
  setEditingIndex(null);
  toast.success('Đã cập nhật câu hỏi');
};

// Delete question
const handleDeleteQuestion = (index: number) => {
  if (previewQuiz.questions.length <= 1) {
    toast.error('Phải có ít nhất 1 câu hỏi');
    return;
  }
  
  if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
  
  const newQuestions = previewQuiz.questions.filter((_, i) => i !== index);
  setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
  toast.success('Đã xóa câu hỏi');
};

// Add new question
const handleAddQuestion = () => {
  const newQuestion = {
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
  };
  
  setPreviewQuiz({
    ...previewQuiz,
    questions: [...previewQuiz.questions, newQuestion],
  });
  
  // Auto scroll to new question
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
};

// Save final quiz
const handleSaveFinalQuiz = async () => {
  // Validate
  if (!previewQuiz.title.trim()) {
    toast.error('Vui lòng nhập tiêu đề');
    return;
  }
  
  for (let i = 0; i < previewQuiz.questions.length; i++) {
    const q = previewQuiz.questions[i];
    if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || 
        !q.optionC.trim() || !q.optionD.trim()) {
      toast.error(`Câu ${i + 1}: Vui lòng điền đầy đủ thông tin`);
      return;
    }
  }
  
  // Save
  createQuizMutation.mutate({
    lessonId: lessonIdNum,
    title: previewQuiz.title,
    description: previewQuiz.description,
    difficulty: previewQuiz.difficulty,
    questions: previewQuiz.questions,
  });
};
```

### 3. Update JSX - AI Mode Section

Thay thế phần AI mode hiện tại bằng:

```typescript
{mode === 'ai' && (
  <>
    {step === 'config' ? (
      // STEP 1: Configuration
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-bold text-purple-900">AI Tự động tạo câu hỏi</h2>
            <p className="text-purple-700 text-sm">AI sẽ phân tích nội dung và tạo câu hỏi phù hợp</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Số câu hỏi & Độ khó */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Số lượng câu hỏi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={aiNumQuestions}
                onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 10)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Độ khó <span className="text-red-500">*</span>
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              >
                <option value="easy">🟢 Dễ</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="hard">🔴 Khó</option>
              </select>
            </div>
          </div>

          {/* Text bổ sung - MỚI */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">
              📝 Nội dung bổ sung (tùy chọn)
            </label>
            <textarea
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={6}
              placeholder="Nhập thêm nội dung để AI tham khảo khi tạo câu hỏi...&#10;&#10;VD: Tập trung vào các khái niệm X, Y, Z&#10;Thêm ví dụ về A, B, C&#10;Bỏ qua phần D, E, F"
            />
            <p className="text-sm text-purple-600 mt-2">
              💡 AI sẽ kết hợp nội dung bài học + text này để tạo câu hỏi chính xác hơn
            </p>
          </div>

          {/* File upload - MỚI */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">
              📎 Tài liệu bổ sung (tùy chọn)
            </label>
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-700 font-medium">
                  Click để chọn file hoặc kéo thả vào đây
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 10MB)
                </p>
              </label>
            </div>
            
            {uploadedFile && (
              <div className="mt-3 flex items-center gap-3 bg-purple-100 rounded-lg p-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                >
                  ❌
                </button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-purple-100 rounded-xl p-6">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span className="text-xl">✨</span>
              AI sẽ tạo:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ <span className="font-semibold text-purple-700">{aiNumQuestions}</span> câu hỏi trắc nghiệm</li>
              <li>✓ Dựa trên: Nội dung bài học + Text bổ sung + File upload</li>
              <li>✓ Độ khó: <span className="font-semibold capitalize text-purple-700">
                {aiDifficulty === 'easy' ? 'Dễ' : aiDifficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span></li>
              <li>✓ Bạn sẽ xem lại và chỉnh sửa trước khi lưu</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/lessons/${lessonIdNum}`)}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={generating}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI đang tạo...
              </>
            ) : (
              <>
                🤖 Để AI tạo quiz
              </>
            )}
          </button>
        </div>
      </motion.div>
    ) : (
      // STEP 2: Preview & Edit - SẼ TẠO Ở BƯỚC TIẾP THEO
      <div>Preview section here...</div>
    )}
  </>
)}
```

---

## 🎯 TIẾP THEO

Tôi sẽ tạo:
1. ✅ Preview section với edit/delete
2. ✅ QuestionEditForm component
3. ✅ Backend API endpoint

**Bạn muốn tôi tiếp tục không?** 

Hoặc bạn muốn tôi tạo file hoàn chỉnh luôn?
