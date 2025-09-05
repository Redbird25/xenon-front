import axios, { AxiosInstance } from 'axios';
import {
  IngestRequest,
  IngestResponse,
  SearchRequest,
  SearchResponse,
  Course,
  Enrollment,
  StudentProgress
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // AI Service endpoints
  async ingestResources(request: IngestRequest): Promise<IngestResponse> {
    const response = await this.api.post<IngestResponse>('/ai/ingest/resources', request);
    return response.data;
  }

  async searchDocuments(request: SearchRequest): Promise<SearchResponse> {
    const response = await this.api.post<SearchResponse>('/ai/search', request);
    return response.data;
  }

  async getSimilarChunks(chunkId: number, topK: number = 5): Promise<any> {
    const response = await this.api.get(`/ai/search/similar/${chunkId}`, {
      params: { top_k: topK }
    });
    return response.data;
  }

  // Core Service endpoints (when implemented)
  async getCourses(): Promise<Course[]> {
    const response = await this.api.get<Course[]>('/courses');
    return response.data;
  }

  async getCourse(courseId: string): Promise<Course> {
    const response = await this.api.get<Course>(`/courses/${courseId}`);
    return response.data;
  }

  async createCourse(course: Partial<Course>): Promise<Course> {
    const response = await this.api.post<Course>('/courses', course);
    return response.data;
  }

  async updateCourse(courseId: string, course: Partial<Course>): Promise<Course> {
    const response = await this.api.put<Course>(`/courses/${courseId}`, course);
    return response.data;
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.api.delete(`/courses/${courseId}`);
  }

  // Enrollment management
  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    const response = await this.api.get<Enrollment[]>(`/courses/${courseId}/enrollments`);
    return response.data;
  }

  async removeEnrollment(enrollmentId: string): Promise<void> {
    await this.api.delete(`/enrollments/${enrollmentId}`);
  }

  // Modules / Lessons (when backend is ready)
  async createModule(courseId: string, module: any): Promise<any> {
    const response = await this.api.post(`/courses/${courseId}/modules`, module);
    return response.data;
  }

  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await this.api.delete(`/courses/${courseId}/modules/${moduleId}`);
  }

  async createLesson(moduleId: string, lesson: any): Promise<any> {
    const response = await this.api.post(`/modules/${moduleId}/lessons`, lesson);
    return response.data;
  }

  async deleteLesson(moduleId: string, lessonId: string): Promise<void> {
    await this.api.delete(`/modules/${moduleId}/lessons/${lessonId}`);
  }

  async enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
    const response = await this.api.post<Enrollment>('/enrollments', {
      courseId,
      studentId
    });
    return response.data;
  }

  async getStudentProgress(enrollmentId: string): Promise<StudentProgress[]> {
    const response = await this.api.get<StudentProgress[]>(`/progress/${enrollmentId}`);
    return response.data;
  }

  async updateProgress(enrollmentId: string, lessonId: string, mastery: number): Promise<StudentProgress> {
    const response = await this.api.post<StudentProgress>('/progress', {
      enrollmentId,
      lessonId,
      mastery
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
