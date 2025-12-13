import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { Course, Lesson, Material } from '../types';

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

  updateLesson: async (id: number, data: Partial<Lesson>): Promise<Lesson> => {
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

  uploadMaterial: async (formData: FormData): Promise<Material> => {
    const response = await springApi.post(ENDPOINTS.MATERIALS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteMaterial: async (id: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.MATERIALS.DELETE(id));
  },

  // Enrollment
  enrollCourse: async (courseId: number, password?: string): Promise<Course> => {
    const response = await springApi.post(`/api/courses/${courseId}/enroll`, { password });
    return response.data;
  },

  getMyEnrolledCourses: async (): Promise<Course[]> => {
    const response = await springApi.get('/api/courses/my-enrollments');
    return response.data;
  },
};
