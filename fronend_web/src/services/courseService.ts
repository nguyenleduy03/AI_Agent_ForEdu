import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { Course, Lesson, Material } from '../types';

// Material upload data interface
export interface MaterialUploadData {
  courseId: number;
  lessonId?: number;
  title: string;
  description?: string;
  fileUrl: string;
  type: string;
  driveFileId?: string;
  driveEmbedLink?: string;
  driveDownloadLink?: string;
  fileSize?: number;
  originalFilename?: string;
}

export const courseService = {
  // Courses
  getCourses: async (): Promise<Course[]> => {
    const response = await springApi.get(ENDPOINTS.COURSES.LIST);
    return response.data;
  },

  getCourse: async (id: number): Promise<Course> => {
    const response = await springApi.get(ENDPOINTS.COURSES.DETAIL(id));
    return response.data;
  },

  getCourseById: async (id: number): Promise<Course> => {
    const response = await springApi.get(ENDPOINTS.COURSES.DETAIL(id));
    return response.data;
  },

  createCourse: async (data: Partial<Course>): Promise<Course> => {
    const response = await springApi.post(ENDPOINTS.COURSES.CREATE, data);
    return response.data;
  },

  updateCourse: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response = await springApi.put(ENDPOINTS.COURSES.UPDATE(id), data);
    return response.data;
  },

  deleteCourse: async (id: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.COURSES.DELETE(id));
  },

  // Lessons
  getLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
    const response = await springApi.get(ENDPOINTS.LESSONS.BY_COURSE(courseId));
    return response.data;
  },

  getLesson: async (id: number): Promise<Lesson> => {
    const response = await springApi.get(ENDPOINTS.LESSONS.DETAIL(id));
    return response.data;
  },

  createLesson: async (courseId: number, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await springApi.post(ENDPOINTS.LESSONS.CREATE(courseId), data);
    return response.data;
  },

  updateLesson: async (id: number, data: { title: string; content: string; orderIndex: number }): Promise<Lesson> => {
    const response = await springApi.put(ENDPOINTS.LESSONS.UPDATE(id), data);
    return response.data;
  },

  deleteLesson: async (id: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.LESSONS.DELETE(id));
  },

  // Materials
  getMaterialsByCourse: async (courseId: number): Promise<Material[]> => {
    const response = await springApi.get(ENDPOINTS.MATERIALS.BY_COURSE(courseId));
    return response.data;
  },

  getMaterialsByLesson: async (lessonId: number): Promise<Material[]> => {
    const response = await springApi.get(ENDPOINTS.MATERIALS.BY_LESSON(lessonId));
    return response.data;
  },

  getCourseMaterialsGeneral: async (courseId: number): Promise<Material[]> => {
    const response = await springApi.get(ENDPOINTS.MATERIALS.GENERAL(courseId));
    return response.data;
  },

  uploadMaterial: async (formData: FormData): Promise<Material> => {
    const response = await springApi.post(ENDPOINTS.MATERIALS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload material với Drive info (JSON)
  uploadMaterialWithDrive: async (data: MaterialUploadData): Promise<Material> => {
    console.log('=== Sending to Spring Boot ===');
    console.log('URL:', ENDPOINTS.MATERIALS.UPLOAD);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('==============================');
    
    try {
      const response = await springApi.post(ENDPOINTS.MATERIALS.UPLOAD, data);
      return response.data;
    } catch (error: any) {
      console.error('=== Spring Boot Error ===');
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
      console.error('=========================');
      throw error;
    }
  },

  deleteMaterial: async (id: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.MATERIALS.DELETE(id));
  },

  // Enrollment
  enrollCourse: async (courseId: number, password?: string): Promise<Course> => {
    const response = await springApi.post(`/api/courses/${courseId}/enroll`, { password });
    return response.data;
  },

  unenrollCourse: async (courseId: number): Promise<void> => {
    await springApi.delete(`/api/courses/${courseId}/unenroll`);
  },

  getMyEnrolledCourses: async (): Promise<Course[]> => {
    const response = await springApi.get('/api/courses/my-enrollments');
    return response.data;
  },

  getMyCourses: async (): Promise<Course[]> => {
    const response = await springApi.get(ENDPOINTS.COURSES.MY_COURSES);
    return response.data;
  },
};
