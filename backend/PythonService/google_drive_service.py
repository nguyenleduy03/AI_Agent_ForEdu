"""
Google Drive Service
Upload và quản lý file trên Google Drive của user
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel
from typing import Optional, List
import os
import io
import requests
from datetime import datetime

router = APIRouter(prefix="/api/drive", tags=["Google Drive"])

# Spring Boot URL để lấy token
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")

# ============================================================================
# MODELS
# ============================================================================

class DriveFileResponse(BaseModel):
    file_id: str
    file_name: str
    mime_type: str
    view_link: str
    download_link: Optional[str]
    embed_link: str
    size: Optional[int]

class DriveFolderResponse(BaseModel):
    folder_id: str
    folder_name: str
    link: str

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_user_access_token(user_id: int) -> str:
    """Lấy access token của user từ OAuth service"""
    try:
        # Gọi endpoint lấy token (tự động refresh nếu expired)
        response = requests.get(
            f"http://localhost:8003/api/oauth/google/token/{user_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        elif response.status_code == 404:
            raise HTTPException(
                status_code=401, 
                detail="Bạn chưa kết nối Google. Vui lòng vào Settings → Kết nối Google."
            )
        else:
            raise HTTPException(status_code=401, detail="Không thể lấy token Google")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"OAuth service không khả dụng: {str(e)}")


def upload_to_drive(access_token: str, file_content: bytes, filename: str, mime_type: str, folder_id: str = None) -> dict:
    """
    Upload file lên Google Drive
    
    Args:
        access_token: Google OAuth access token
        file_content: Nội dung file (bytes)
        filename: Tên file
        mime_type: MIME type (video/mp4, application/pdf, etc.)
        folder_id: ID folder trên Drive (optional)
    
    Returns:
        Dict với file_id, links
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # Metadata của file
    metadata = {
        "name": filename
    }
    if folder_id:
        metadata["parents"] = [folder_id]
    
    # Multipart upload
    import json
    
    # Boundary cho multipart
    boundary = "===BOUNDARY==="
    
    # Build multipart body
    body = (
        f'--{boundary}\r\n'
        f'Content-Type: application/json; charset=UTF-8\r\n\r\n'
        f'{json.dumps(metadata)}\r\n'
        f'--{boundary}\r\n'
        f'Content-Type: {mime_type}\r\n\r\n'
    ).encode('utf-8') + file_content + f'\r\n--{boundary}--'.encode('utf-8')
    
    # Upload
    response = requests.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": f"multipart/related; boundary={boundary}"
        },
        data=body,
        timeout=300  # 5 phút cho file lớn
    )
    
    if response.status_code not in [200, 201]:
        error_detail = response.json().get('error', {}).get('message', response.text)
        raise HTTPException(status_code=response.status_code, detail=f"Upload failed: {error_detail}")
    
    file_data = response.json()
    file_id = file_data['id']
    
    # Set permission: Anyone with link can view
    permission_response = requests.post(
        f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions",
        headers=headers,
        json={
            "type": "anyone",
            "role": "reader"
        },
        timeout=30
    )
    
    if permission_response.status_code not in [200, 201]:
        print(f"Warning: Could not set public permission: {permission_response.text}")
    
    return {
        "file_id": file_id,
        "file_name": file_data.get('name'),
        "mime_type": file_data.get('mimeType'),
        "size": file_data.get('size'),
        "view_link": file_data.get('webViewLink', f"https://drive.google.com/file/d/{file_id}/view"),
        "download_link": file_data.get('webContentLink'),
        "embed_link": f"https://drive.google.com/file/d/{file_id}/preview"
    }


def create_drive_folder(access_token: str, folder_name: str, parent_id: str = None) -> dict:
    """Tạo folder trên Drive"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder"
    }
    if parent_id:
        metadata["parents"] = [parent_id]
    
    response = requests.post(
        "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink",
        headers=headers,
        json=metadata,
        timeout=30
    )
    
    if response.status_code not in [200, 201]:
        raise HTTPException(status_code=response.status_code, detail="Failed to create folder")
    
    data = response.json()
    return {
        "folder_id": data['id'],
        "folder_name": data['name'],
        "link": data.get('webViewLink', f"https://drive.google.com/drive/folders/{data['id']}")
    }


def find_folder_by_name(access_token: str, folder_name: str, parent_id: str = None) -> Optional[str]:
    """Tìm folder theo tên, trả về folder_id nếu tồn tại"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # Query tìm folder
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    
    response = requests.get(
        "https://www.googleapis.com/drive/v3/files",
        headers=headers,
        params={
            "q": query,
            "fields": "files(id,name)",
            "pageSize": 1
        },
        timeout=30
    )
    
    if response.status_code == 200:
        files = response.json().get('files', [])
        if files:
            return files[0]['id']
    return None


def get_or_create_folder(access_token: str, folder_name: str, parent_id: str = None) -> str:
    """Lấy folder_id nếu tồn tại, không thì tạo mới"""
    # Tìm folder
    folder_id = find_folder_by_name(access_token, folder_name, parent_id)
    
    if folder_id:
        return folder_id
    
    # Tạo mới nếu chưa có
    result = create_drive_folder(access_token, folder_name, parent_id)
    return result['folder_id']


def get_course_folder(access_token: str, course_id: int, course_name: str = None) -> str:
    """
    Lấy hoặc tạo folder cho course
    Cấu trúc: My Drive / AgentForEdu / Course_{id}_{name}
    """
    # 1. Tạo/lấy folder gốc "AgentForEdu"
    root_folder_id = get_or_create_folder(access_token, "AgentForEdu")
    
    # 2. Tạo/lấy folder cho course
    course_folder_name = f"Course_{course_id}"
    if course_name:
        # Sanitize tên course (bỏ ký tự đặc biệt)
        safe_name = "".join(c for c in course_name if c.isalnum() or c in (' ', '_', '-')).strip()
        safe_name = safe_name[:50]  # Giới hạn 50 ký tự
        course_folder_name = f"Course_{course_id}_{safe_name}"
    
    course_folder_id = get_or_create_folder(access_token, course_folder_name, root_folder_id)
    
    return course_folder_id


def delete_drive_file(access_token: str, file_id: str) -> bool:
    """Xóa file trên Drive"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.delete(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        headers=headers,
        timeout=30
    )
    
    return response.status_code in [200, 204]


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/upload", response_model=DriveFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    folder_id: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    course_name: Optional[str] = Form(None),
    lesson_id: Optional[int] = Form(None)
):
    """
    Upload file lên Google Drive của user
    
    - **file**: File cần upload (PDF, DOC, MP4, etc.)
    - **user_id**: ID của user (giáo viên)
    - **folder_id**: ID folder trên Drive (optional - nếu không có sẽ tự tạo)
    - **course_id**: ID khóa học (để tự động tạo folder)
    - **course_name**: Tên khóa học (để đặt tên folder)
    - **lesson_id**: ID bài học (để lưu vào DB)
    
    Cấu trúc folder tự động:
    📁 My Drive
    └── 📁 AgentForEdu
        └── 📁 Course_{id}_{name}
            └── 📄 uploaded_file
    
    Supported formats:
    - Documents: PDF, DOC, DOCX, TXT, PPT, PPTX
    - Videos: MP4, AVI, MOV, MKV
    - Images: JPG, PNG, GIF
    """
    # Validate file size (max 100MB for free tier)
    MAX_SIZE = 100 * 1024 * 1024  # 100MB
    
    # Read file content
    file_content = await file.read()
    
    if len(file_content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File quá lớn. Giới hạn 100MB.")
    
    # Get user's access token
    access_token = await get_user_access_token(user_id)
    
    # Determine target folder
    target_folder_id = folder_id
    
    # Nếu có course_id và chưa có folder_id → tự động tạo folder theo course
    if course_id and not folder_id:
        target_folder_id = get_course_folder(access_token, course_id, course_name)
        print(f"✅ Auto-created/found folder for course {course_id}: {target_folder_id}")
    
    # Determine MIME type
    mime_type = file.content_type or "application/octet-stream"
    
    # Upload to Drive
    result = upload_to_drive(
        access_token=access_token,
        file_content=file_content,
        filename=file.filename,
        mime_type=mime_type,
        folder_id=target_folder_id
    )
    
    # TODO: Lưu vào database (bảng materials)
    # if course_id or lesson_id:
    #     save_material_to_db(course_id, lesson_id, result)
    
    return DriveFileResponse(**result)


@router.post("/folder", response_model=DriveFolderResponse)
async def create_folder(
    folder_name: str = Form(...),
    user_id: int = Form(...),
    parent_id: Optional[str] = Form(None)
):
    """
    Tạo folder trên Google Drive
    
    - **folder_name**: Tên folder
    - **user_id**: ID của user
    - **parent_id**: ID folder cha (optional)
    """
    access_token = await get_user_access_token(user_id)
    
    result = create_drive_folder(
        access_token=access_token,
        folder_name=folder_name,
        parent_id=parent_id
    )
    
    return DriveFolderResponse(**result)


@router.delete("/file/{file_id}")
async def delete_file(
    file_id: str,
    user_id: int
):
    """
    Xóa file trên Google Drive
    
    - **file_id**: ID file trên Drive
    - **user_id**: ID của user (owner)
    """
    access_token = await get_user_access_token(user_id)
    
    success = delete_drive_file(access_token, file_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="File không tồn tại hoặc không có quyền xóa")
    
    return {"success": True, "message": "File đã được xóa"}


@router.get("/files")
async def list_files(
    user_id: int,
    folder_id: Optional[str] = None,
    page_size: int = 20
):
    """
    Liệt kê files trên Drive của user
    
    - **user_id**: ID của user
    - **folder_id**: ID folder (optional, mặc định root)
    - **page_size**: Số file mỗi trang
    """
    access_token = await get_user_access_token(user_id)
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # Query để lấy files
    query = "trashed=false"
    if folder_id:
        query += f" and '{folder_id}' in parents"
    
    response = requests.get(
        "https://www.googleapis.com/drive/v3/files",
        headers=headers,
        params={
            "q": query,
            "pageSize": page_size,
            "fields": "files(id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime)",
            "orderBy": "modifiedTime desc"
        },
        timeout=30
    )
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to list files")
    
    data = response.json()
    
    files = []
    for f in data.get('files', []):
        files.append({
            "file_id": f['id'],
            "file_name": f['name'],
            "mime_type": f['mimeType'],
            "size": f.get('size'),
            "view_link": f.get('webViewLink'),
            "download_link": f.get('webContentLink'),
            "embed_link": f"https://drive.google.com/file/d/{f['id']}/preview",
            "created_time": f.get('createdTime'),
            "modified_time": f.get('modifiedTime')
        })
    
    return {"files": files, "count": len(files)}


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/quota")
async def get_storage_quota(user_id: int):
    """
    Lấy thông tin dung lượng Drive của user
    """
    access_token = await get_user_access_token(user_id)
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
        headers=headers,
        timeout=30
    )
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to get quota")
    
    quota = response.json().get('storageQuota', {})
    
    # Convert to readable format
    def bytes_to_gb(b):
        if b:
            return round(int(b) / (1024**3), 2)
        return 0
    
    return {
        "total_gb": bytes_to_gb(quota.get('limit')),
        "used_gb": bytes_to_gb(quota.get('usage')),
        "free_gb": bytes_to_gb(int(quota.get('limit', 0)) - int(quota.get('usage', 0))),
        "usage_percent": round(int(quota.get('usage', 0)) / int(quota.get('limit', 1)) * 100, 1) if quota.get('limit') else 0
    }
