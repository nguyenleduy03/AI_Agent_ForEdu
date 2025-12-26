# 📁 Google Drive Integration - Hướng dẫn Setup

## Tổng quan

Cho phép giáo viên upload file và video lên Google Drive của họ, sinh viên xem qua link public.

## Bước 1: Enable Google Drive API

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Chọn project OAuth hiện tại (EduAgent OAuth)
3. Vào **APIs & Services** → **Library**
4. Tìm **"Google Drive API"** → Click **Enable**

## Bước 2: Cập nhật OAuth Consent Screen (nếu cần)

1. Vào **APIs & Services** → **OAuth consent screen**
2. Click **Edit App**
3. Ở phần **Scopes**, thêm scope:
   - `https://www.googleapis.com/auth/drive.file`
4. Save

## Bước 3: User cần kết nối lại Google

Vì thêm scope mới, user cần:
1. Vào **Settings** → **Kết nối Google**
2. Click **Ngắt kết nối** (nếu đã kết nối)
3. Click **Kết nối Google** lại
4. Chấp nhận quyền mới (Google Drive)

## API Endpoints

### Upload file
```
POST /api/drive/upload
Content-Type: multipart/form-data

- file: File cần upload
- user_id: ID user (giáo viên)
- folder_id: (optional) ID folder trên Drive
- course_id: (optional) ID khóa học
- lesson_id: (optional) ID bài học
```

### Tạo folder
```
POST /api/drive/folder
Content-Type: multipart/form-data

- folder_name: Tên folder
- user_id: ID user
- parent_id: (optional) ID folder cha
```

### Xóa file
```
DELETE /api/drive/file/{file_id}?user_id={user_id}
```

### Liệt kê files
```
GET /api/drive/files?user_id={user_id}&folder_id={folder_id}
```

### Xem dung lượng
```
GET /api/drive/quota?user_id={user_id}
```

## Response mẫu

```json
{
  "file_id": "1abc123xyz",
  "file_name": "bai_giang_1.pdf",
  "mime_type": "application/pdf",
  "view_link": "https://drive.google.com/file/d/1abc123xyz/view",
  "download_link": "https://drive.google.com/uc?id=1abc123xyz&export=download",
  "embed_link": "https://drive.google.com/file/d/1abc123xyz/preview",
  "size": 1024000
}
```

## Embed video/file trong Frontend

### Video
```tsx
<iframe 
  src={material.embed_link}
  width="100%" 
  height="480"
  allow="autoplay; fullscreen"
  allowFullScreen
/>
```

### PDF
```tsx
<iframe 
  src={material.embed_link}
  width="100%" 
  height="600"
/>
```

## Giới hạn

- **File size**: Max 100MB (có thể tăng)
- **Storage**: 15GB free/account (Drive của giáo viên)
- **Formats**: PDF, DOC, DOCX, PPT, PPTX, MP4, AVI, MOV, JPG, PNG

## Test

```bash
# Test upload
curl -X POST http://localhost:8000/api/drive/upload \
  -F "file=@test.pdf" \
  -F "user_id=1"

# Test list files
curl "http://localhost:8000/api/drive/files?user_id=1"

# Test quota
curl "http://localhost:8000/api/drive/quota?user_id=1"
```
