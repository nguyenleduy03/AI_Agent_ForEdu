# 🔧 ADMIN DASHBOARD UPGRADE - Đề xuất nâng cấp

## 📊 Hiện trạng Admin Dashboard:

### ✅ Đã có (4 tabs):
1. **Users** - Quản lý người dùng
2. **RAG** - Quản lý knowledge base
3. **System** - System health
4. **Analytics** - Thống kê cơ bản

### ❌ Thiếu:
- Quản lý khóa học (Courses)
- Quản lý bài học (Lessons)
- Quản lý quiz
- Quản lý materials
- Quản lý enrollments
- System logs
- Advanced analytics
- Backup/Restore

---

## 🎯 ĐỀ XUẤT NÂNG CẤP:

### 1. **Course Management** (Quản lý khóa học)

**API đã có:**
```
GET    /api/courses/internal/all
GET    /api/courses/{id}
DELETE /api/courses/{id}
PUT    /api/courses/{id}
```

**Tính năng:**
- ✅ Xem tất cả khóa học (public + private)
- ✅ Xóa khóa học bất kỳ
- ✅ Sửa thông tin khóa học
- ✅ Thống kê: Tổng khóa học, public/private, có/chưa có bài học
- ✅ Filter theo creator, status, enrollment count
- ✅ Bulk actions: Delete, Set public/private

---

### 2. **Lesson Management** (Quản lý bài học)

**API đã có:**
```
GET    /api/courses/{courseId}/lessons
DELETE /api/lessons/{id}
PUT    /api/lessons/{id}
```

**Tính năng:**
- ✅ Xem tất cả bài học
- ✅ Xóa bài học bất kỳ
- ✅ Sửa nội dung bài học
- ✅ Thống kê: Tổng bài học, có/chưa có materials
- ✅ Filter theo course, creator

---

### 3. **Quiz Management** (Quản lý quiz)

**API đã có:**
```
GET    /api/quiz/{id}
DELETE /api/quiz/{id}
PUT    /api/quiz/{id}
```

**Tính năng:**
- ✅ Xem tất cả quiz
- ✅ Xóa quiz bất kỳ
- ✅ Sửa câu hỏi
- ✅ Thống kê: Tổng quiz, theo difficulty
- ✅ Xem quiz results

---

### 4. **Material Management** (Quản lý tài liệu)

**API đã có:**
```
GET    /api/materials/{id}
DELETE /api/materials/{id}
```

**Tính năng:**
- ✅ Xem tất cả materials
- ✅ Xóa material bất kỳ
- ✅ Thống kê: Tổng materials, theo type (PDF, DOC, VIDEO...)
- ✅ Storage usage

---

### 5. **Enrollment Management** (Quản lý đăng ký)

**API đã có:**
```
GET    /api/courses/{id}/enrollments (cần thêm)
DELETE /api/courses/{id}/unenroll
```

**Tính năng:**
- ✅ Xem tất cả enrollments
- ✅ Xóa enrollment (kick student)
- ✅ Thống kê: Tổng enrollments, theo course
- ✅ Enrollment trends

---

### 6. **System Logs** (Logs hệ thống)

**API đã có:**
```
GET    /api/logs
GET    /api/logs/user/{id}
```

**Tính năng:**
- ✅ Xem system logs
- ✅ Filter theo user, action, date
- ✅ Export logs
- ✅ Real-time log streaming

---

### 7. **Advanced Analytics** (Phân tích nâng cao)

**Metrics:**
- 📊 User growth (theo ngày/tuần/tháng)
- 📊 Course popularity
- 📊 Quiz completion rates
- 📊 Material download stats
- 📊 Chat usage statistics
- 📊 API usage statistics

---

### 8. **System Settings** (Cài đặt hệ thống)

**Tính năng:**
- ⚙️ Email settings
- ⚙️ AI settings (Gemini API key)
- ⚙️ Storage settings
- ⚙️ Backup/Restore database
- ⚙️ Clear cache

---

## 🎨 UI/UX Improvements:

### 1. **Dashboard Overview** (Trang tổng quan)
```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                              👑     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 Quick Stats                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ 150  │ │  45  │ │  89  │ │ 234  │ │ 1.2K │     │
│  │Users │ │Course│ │Lesson│ │ Quiz │ │ Chat │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                      │
│  📈 Recent Activity                                  │
│  • User "john" enrolled in "Python Basic"           │
│  • Quiz "AI Quiz" created by "teacher1"             │
│  • Material "PDF" uploaded to "Lesson 5"            │
│                                                      │
│  ⚠️  System Alerts                                   │
│  • Storage usage: 85% (Warning)                     │
│  • API quota: 90% (Critical)                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2. **Tabs Navigation**
```
[Overview] [Users] [Courses] [Lessons] [Quiz] [Materials] 
[Enrollments] [Logs] [Analytics] [Settings]
```

### 3. **Advanced Filters**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Search: [____________]  📅 Date: [____] to [____]│
│ 🏷️  Role: [All ▼]  📊 Status: [All ▼]  🔄 [Refresh]│
└─────────────────────────────────────────────────────┘
```

### 4. **Bulk Actions**
```
☑️ Select All  |  Actions: [Delete] [Export] [Set Status]
```

### 5. **Data Table với Pagination**
```
┌─────────────────────────────────────────────────────┐
│ ID │ Name        │ Email          │ Role    │ Action│
├────┼─────────────┼────────────────┼─────────┼───────┤
│ 1  │ John Doe    │ john@email.com │ STUDENT │ [Edit]│
│ 2  │ Jane Smith  │ jane@email.com │ TEACHER │ [Edit]│
└─────────────────────────────────────────────────────┘
Showing 1-10 of 150  [<] [1] [2] [3] [>]
```

---

## 🔧 Implementation Plan:

### Phase 1: Core Features (Week 1)
- ✅ Course Management tab
- ✅ Lesson Management tab
- ✅ Enhanced User Management
- ✅ Basic Analytics

### Phase 2: Advanced Features (Week 2)
- ✅ Quiz Management
- ✅ Material Management
- ✅ Enrollment Management
- ✅ System Logs

### Phase 3: Polish (Week 3)
- ✅ Advanced Analytics
- ✅ System Settings
- ✅ Backup/Restore
- ✅ UI/UX improvements

---

## 📝 Code Structure:

```
fronend_web/src/pages/
├── AdminPage.tsx (Main dashboard)
├── admin/
│   ├── AdminOverview.tsx
│   ├── AdminUsers.tsx
│   ├── AdminCourses.tsx
│   ├── AdminLessons.tsx
│   ├── AdminQuiz.tsx
│   ├── AdminMaterials.tsx
│   ├── AdminEnrollments.tsx
│   ├── AdminLogs.tsx
│   ├── AdminAnalytics.tsx
│   └── AdminSettings.tsx
```

---

## 🎯 Priority Features (Làm ngay):

### 1. **Course Management** ⭐⭐⭐
- Quan trọng nhất
- Admin cần xem và quản lý tất cả khóa học

### 2. **Enhanced User Management** ⭐⭐⭐
- Thêm bulk actions
- Thêm filters
- Thêm export

### 3. **System Logs** ⭐⭐
- Để debug và monitor
- Track user actions

### 4. **Analytics Dashboard** ⭐⭐
- Để hiểu user behavior
- Track system health

---

## 💡 Quick Wins (Dễ làm, hiệu quả cao):

1. **Add Course Management Tab** (30 phút)
   - Reuse existing APIs
   - Simple table view

2. **Add Bulk Delete Users** (15 phút)
   - Checkbox selection
   - Confirm dialog

3. **Add Export to CSV** (20 phút)
   - Export users list
   - Export courses list

4. **Add Quick Stats Cards** (15 phút)
   - Total users, courses, lessons
   - Visual cards

---

## 🚀 Bắt đầu từ đâu?

### Option 1: Nâng cấp từng phần (Khuyến nghị)
Tôi sẽ tạo từng component nhỏ, test và merge vào AdminPage hiện tại.

### Option 2: Tạo AdminPage mới hoàn toàn
Tạo AdminPageV2.tsx với tất cả tính năng mới.

---

**Bạn muốn tôi bắt đầu với tính năng nào trước?**

Gợi ý:
1. Course Management (quan trọng nhất)
2. Enhanced User Management (cải thiện hiện tại)
3. System Logs (để monitor)
4. Analytics Dashboard (để insights)
