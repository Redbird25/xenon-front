import axios, { AxiosInstance } from 'axios';
import type { StudentProfileDTO, LearningStyle } from '../types';

// Minimal backend course types for new API
export interface BackendLesson {
  id: string;
  title: string;
  description: string;
  position: number;
  minMastery: number;
}

export interface BackendModule {
  id: string;
  title: string;
  position: number;
  lessons: BackendLesson[];
}

export interface BackendSource {
  id: string;
  kind: string;
  uri: string;
}

export type BackendCourseStatus = 'DRAFT' | 'READY' | 'INGEST_FAILED' | 'PUBLISHED' | 'ARCHIVED';

export interface BackendCourse {
  id: string;
  tenantId: string;
  ownerUserId: string;
  title: string;
  description: string;
  lang: string;
  status: BackendCourseStatus;
  createdAt: string;
  modules?: BackendModule[];
  sources?: BackendSource[];
}

export interface CreateCourseResponse { courseId: string; status: BackendCourseStatus }

export interface StudentMyCourseItem {
  id: string;
  tenantId: string;
  studentId: string;
  courseResponse: BackendCourse;
  createdBy: string;
  createdAt: string;
  status: string;
  scope: string;
  totalStudents: number;
}
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
    const env = (import.meta as any).env || {};
    const isDev = !!env.DEV;
    const configured: string | undefined = env?.VITE_API_BASE_URL;
    // To avoid Mixed Content on HTTPS (Netlify), use same-origin relative base in prod
    // unless an explicit HTTPS API base is provided.
    const baseURL = isDev
      ? ''
      : (configured && /^https:\/\//i.test(configured) ? configured : '');
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(
      (config) => {
        // Prefer new keys; support legacy for dev
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
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
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_userinfo');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // AUTH endpoints
  async registerSelfLearner(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<string> {
    const res = await this.api.post('/auth/register', payload, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return String(res.data);
  }

  async login(payload: { email: string; password: string }): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
  }> {
    const res = await this.api.post('/auth/token', payload);
    return res.data;
  }

  async fetchUserInfo(accessToken: string): Promise<any> {
    const res = await this.api.get('/auth/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  // Student onboarding/profile
  async postStudentOnboarding(payload: { interests: string[]; hobbies: string[]; learningStyle: LearningStyle }): Promise<StudentProfileDTO> {
    const res = await this.api.post<StudentProfileDTO>('/student/onboarding', payload);
    return res.data;
  }

  // Courses — creation
  async createCourse(payload: { title: string; description: string; lang: string }): Promise<CreateCourseResponse> {
    const res = await this.api.post<CreateCourseResponse>('/api/course/create', payload);
    return res.data;
  }

  async createCourseWithUri(payload: { title: string; description: string; lang: string; sourceUris: string[] }): Promise<CreateCourseResponse> {
    const res = await this.api.post<CreateCourseResponse>('/api/course/create-with-uri', payload);
    return res.data;
  }

  async getCourseById(courseId: string): Promise<BackendCourse> {
    const res = await this.api.get<BackendCourse>(`/api/course/get`, { params: { courseId } });
    return res.data;
  }

  async getStudentMyCourses(): Promise<StudentMyCourseItem[]> {
    const res = await this.api.get<StudentMyCourseItem[]>(`/student/my-courses`);
    return res.data;
  }

  async getStudentProfile(): Promise<StudentProfileDTO> {
    const res = await this.api.get<StudentProfileDTO>('/student/profile');
    return res.data;
  }

  async updateStudentProfile(payload: Partial<Pick<StudentProfileDTO, 'interests' | 'hobbies' | 'learningStyle'>>): Promise<void> {
    await this.api.put('/student/profile', payload);
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

  async createCourseLegacy(course: Partial<Course>): Promise<Course> {
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
