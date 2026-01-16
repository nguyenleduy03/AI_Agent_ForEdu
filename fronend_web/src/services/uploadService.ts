import { fastApi, springApi } from './api';

export interface UploadAvatarResponse {
  success: boolean;
  file_id: string;
  avatar_url: string;
  view_link: string;
}

export interface UploadThumbnailResponse {
  success: boolean;
  file_id: string;
  thumbnail_url: string;
  view_link: string;
}

export const uploadService = {
  /**
   * Upload avatar cho user lên Google Drive
   */
  async uploadUserAvatar(file: File, userId: number): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId.toString());

    const response = await fastApi.post('/api/drive/avatar/user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Upload thumbnail cho khóa học lên Google Drive
   */
  async uploadCourseThumbnail(
    file: File,
    userId: number,
    courseId: number
  ): Promise<UploadThumbnailResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId.toString());
    formData.append('course_id', courseId.toString());

    const response = await fastApi.post('/api/drive/avatar/course', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Cập nhật avatar URL trong database (sau khi upload lên Drive)
   */
  async updateUserAvatar(avatarUrl: string, avatarDriveId: string) {
    const response = await springApi.put('/api/auth/avatar', {
      avatarUrl,
      avatarDriveId,
    });
    return response.data;
  },

  /**
   * Cập nhật thumbnail URL cho khóa học (sau khi upload lên Drive)
   */
  async updateCourseThumbnail(
    courseId: number,
    thumbnailUrl: string,
    thumbnailDriveId: string
  ) {
    const response = await springApi.put(`/api/courses/${courseId}/thumbnail`, {
      thumbnailUrl,
      thumbnailDriveId,
    });
    return response.data;
  },
};
