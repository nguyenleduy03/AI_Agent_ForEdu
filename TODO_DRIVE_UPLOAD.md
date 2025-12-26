# 📋 TODO: Upload Tài Liệu & Video lên Google Drive

## Tổng quan
Cho phép giáo viên upload file (PDF, DOC, PPT) và video (MP4) lên Google Drive khi tạo/sửa bài học.

---

## ✅ ĐÃ HOÀN THÀNH

### Backend Python (FastAPI)
- [x] Tạo `google_drive_service.py` - Service upload lên Drive
- [x] Thêm scope `drive.file` vào OAuth
- [x] Đăng ký router vào `main.py`
- [x] Tự động tạo folder theo course

### Backend Spring Boot
- [x] Cập nhật `MaterialType` enum (thêm VIDEO, MP4, AVI, MOV, DOCX, PPTX)
- [x] Cập nhật `Material` entity (thêm driveFileId, driveEmbedLink, lessonId, fileSize)
- [x] Cập nhật `MaterialRequest` DTO
- [x] Cập nhật `MaterialResponse` DTO
- [x] Cập nhật `MaterialRepository` (thêm findByLessonId, findByDriveFileId)
- [x] Cập nhật `MaterialService` (getMaterialsByLesson, formatFileSize)
- [x] Cập nhật `MaterialController` (thêm endpoint /lessons/{id}/materials)

### Frontend Services
- [x] Tạo `driveService.ts` - Upload/quản lý file trên Drive
- [x] Cập nhật `courseService.ts` - Thêm uploadMaterialWithDrive, getMaterialsByLesson
- [x] Cập nhật `api.ts` - Thêm ENDPOINTS.MATERIALS.BY_LESSON

### Frontend Components
- [x] Tạo `FileUploader.tsx` - Drag & drop upload với progress
- [x] Tạo `MaterialList.tsx` - Hiển thị danh sách materials với video player

### Frontend Pages
- [x] Cập nhật `CreateLessonPage.tsx` - Thêm section upload tài liệu
- [x] Sửa lỗi `CreateLessonPage.tsx` - Pending uploads flow (upload Drive trước, save DB sau khi có lessonId)
- [x] `LessonPage.tsx` - Hiển thị materials trong bài học

### Types
- [x] Cập nhật `Material` interface trong `types/index.ts`
- [x] Thêm `MaterialType` type

### Bug Fixes
- [x] Sửa `MaterialRequest.java` - Đổi `type` từ enum sang String, thêm `getMaterialType()` helper
- [x] Sửa `MaterialService.java` - Sử dụng `request.getMaterialType()` để convert string → enum
- [x] Sửa `CreateLessonPage.tsx` - Xóa import components không tồn tại, implement inline uploader

---

## 🧪 TEST CASES

### Backend
1. Upload file PDF → Verify lưu vào Drive + DB
2. Upload video MP4 → Verify embed link hoạt động
3. Xóa material → Verify xóa cả Drive + DB
4. Lấy materials theo course/lesson

### Frontend
1. Drag & drop file → Upload thành công
2. File > 100MB → Hiển thị lỗi
3. File type không hỗ trợ → Hiển thị lỗi
4. Xem video trong lesson → Player hoạt động
5. Download file → Tải về thành công

---

## ⚠️ LƯU Ý

1. **User phải kết nối lại Google OAuth** để có scope Drive mới
2. **File size limit**: 100MB (có thể tăng)
3. **Supported formats**: PDF, DOC, DOCX, PPT, PPTX, TXT, MP4, AVI, MOV, JPG, PNG
4. **Storage**: Dùng Drive của giáo viên (15GB free/account)
5. **Permission**: Files được set "Anyone with link can view"

---

**Bắt đầu:** Phase 1 - Database Schema
