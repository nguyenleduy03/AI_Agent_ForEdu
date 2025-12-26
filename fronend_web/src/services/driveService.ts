/**
 * Google Drive Service
 * Upload và quản lý file trên Google Drive
 */

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

export interface DriveUploadResponse {
  file_id: string;
  file_name: string;
  mime_type: string;
  view_link: string;
  download_link?: string;
  embed_link: string;
  size?: number;
}

export interface DriveQuota {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_percent: number;
}

export interface DriveFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  size?: number;
  view_link?: string;
  download_link?: string;
  embed_link: string;
  created_time?: string;
  modified_time?: string;
}

export const driveService = {
  /**
   * Upload file lên Google Drive
   */
  uploadFile: async (
    file: File,
    userId: number,
    courseId: number,
    courseName?: string,
    lessonId?: number
  ): Promise<DriveUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId.toString());
    formData.append('course_id', courseId.toString());
    if (courseName) {
      formData.append('course_name', courseName);
    }
    if (lessonId) {
      formData.append('lesson_id', lessonId.toString());
    }

    const response = await fetch(`${FASTAPI_URL}/api/drive/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Lấy thông tin dung lượng Drive
   */
  getQuota: async (userId: number): Promise<DriveQuota> => {
    const response = await fetch(`${FASTAPI_URL}/api/drive/quota?user_id=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get quota');
    }

    return response.json();
  },

  /**
   * Liệt kê files trên Drive
   */
  listFiles: async (userId: number, folderId?: string): Promise<{ files: DriveFile[]; count: number }> => {
    let url = `${FASTAPI_URL}/api/drive/files?user_id=${userId}`;
    if (folderId) {
      url += `&folder_id=${folderId}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list files');
    }

    return response.json();
  },

  /**
   * Xóa file trên Drive
   */
  deleteFile: async (fileId: string, userId: number): Promise<void> => {
    const response = await fetch(`${FASTAPI_URL}/api/drive/file/${fileId}?user_id=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete file');
    }
  },

  /**
   * Tạo folder trên Drive
   */
  createFolder: async (
    folderName: string,
    userId: number,
    parentId?: string
  ): Promise<{ folder_id: string; folder_name: string; link: string }> => {
    const formData = new FormData();
    formData.append('folder_name', folderName);
    formData.append('user_id', userId.toString());
    if (parentId) {
      formData.append('parent_id', parentId);
    }

    const response = await fetch(`${FASTAPI_URL}/api/drive/folder`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create folder');
    }

    return response.json();
  },
};

/**
 * Helper: Lấy MaterialType từ MIME type hoặc filename
 */
export const getMaterialTypeFromMime = (mimeType: string, filename?: string): string => {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
    'text/html': 'HTML',
    'video/mp4': 'MP4',
    'video/x-msvideo': 'AVI',
    'video/quicktime': 'MOV',
    'video/webm': 'VIDEO',
    'video/x-matroska': 'VIDEO',
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'image/webp': 'IMAGE',
  };

  // Try MIME type first
  if (mimeType && mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // Fallback to file extension
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'DOC',
      'docx': 'DOCX',
      'ppt': 'PPT',
      'pptx': 'PPTX',
      'txt': 'TXT',
      'html': 'HTML',
      'mp4': 'MP4',
      'avi': 'AVI',
      'mov': 'MOV',
      'webm': 'VIDEO',
      'mkv': 'VIDEO',
      'jpg': 'IMAGE',
      'jpeg': 'IMAGE',
      'png': 'IMAGE',
      'gif': 'IMAGE',
      'webp': 'IMAGE',
    };
    if (ext && extMap[ext]) {
      return extMap[ext];
    }
  }

  return 'OTHER';
};

/**
 * Helper: Kiểm tra file type có được hỗ trợ không
 */
export const isSupportedFileType = (file: File): boolean => {
  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/html',
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/webm',
    'video/x-matroska', // mkv
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Also check by file extension if MIME type is empty or generic
  if (!file.type || file.type === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'html', 'mp4', 'avi', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
    return supportedExtensions.includes(ext || '');
  }

  return supportedTypes.includes(file.type);
};

/**
 * Helper: Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Helper: Kiểm tra file có phải video không
 */
export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

/**
 * Helper: Kiểm tra file có phải document không
 */
export const isDocumentFile = (mimeType: string): boolean => {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/html',
  ];
  return docTypes.includes(mimeType);
};

export default driveService;
