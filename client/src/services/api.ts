import { Course, CourseValidationReport, User } from '@syllabusforge/shared';

// If running on Vercel or if the env URL points to an external dormant service (like onrender),
// always route to the unified Vercel serverless backend at '/api'.
const isVercelHost = typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app');
const rawEnvUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
const envUrl = (isVercelHost || rawEnvUrl.includes('onrender.com')) ? '' : rawEnvUrl;

const API_BASE = envUrl
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`)
  : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('syllabusforge_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  let response: Response;
  try {
    const signal = options.signal || AbortSignal.timeout(15000);
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal,
    });
  } catch (netErr: any) {
    if (netErr?.name === 'TimeoutError') {
      throw new Error('Connection timed out. Please check your network connection or try again.');
    }
    if (netErr?.message === 'Failed to fetch' || netErr?.name === 'TypeError') {
      throw new Error('Unable to connect to the Course Design Portal server. Please check your network or try again.');
    }
    throw netErr;
  }

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  googleLogin: (data: { email?: string; name?: string; credential?: string; accessToken?: string; avatar?: string; googleId?: string }) =>
    request<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: any) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: User }>('/auth/me'),
  getUsers: () => request<User[]>('/auth/users'),

  // Courses
  getCourses: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<Course[]>(`/courses${query}`);
  },
  getCourse: (id: string) => request<Course>(`/courses/${id}`),
  createCourse: (data: Partial<Course>) =>
    request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (id: string, data: Partial<Course>) =>
    request<Course>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCourse: (id: string) =>
    request<{ message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    }),
  validateCourse: (id: string) =>
    request<CourseValidationReport>(`/courses/${id}/validate`, {
      method: 'POST',
    }),
  submitCourse: (id: string) =>
    request<{ message: string; course: Course; report: CourseValidationReport }>(`/courses/${id}/submit`, {
      method: 'POST',
    }),
  reviewCourse: (id: string, data: { action: 'APPROVE' | 'RETURN'; remarks?: string; section?: string }) =>
    request<{ message: string; course: Course }>(`/courses/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviseCourse: (id: string) =>
    request<{ message: string; course: Course }>(`/courses/${id}/revise`, {
      method: 'POST',
    }),
  getExportUrl: (id: string, format: 'docx' | 'pdf' = 'docx') =>
    `/api/courses/${id}/export?format=${format}`,
  exportCourseBlob: async (course: Course, format: 'docx' | 'pdf' = 'docx'): Promise<Blob> => {
    const token = localStorage.getItem('syllabusforge_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // 1. Try POST /courses/export sending current course state (works for unsaved draft & live changes)
    try {
      const res = await fetch(`${API_BASE}/courses/export?format=${format}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ course, format }),
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch (err) {
      console.warn('POST /courses/export failed, trying fallback', err);
    }

    // 2. Fallback to GET /courses/:id/export if _id exists
    if (course._id) {
      const res = await fetch(`${API_BASE}/courses/${course._id}/export?format=${format}`, {
        headers,
      });
      if (res.ok) {
        return await res.blob();
      }
    }

    throw new Error('Export service encountered an error. Please try again.');
  },

  // Master Data
  getMaster: <T = any>(collection: string) => request<T[]>(`/master/${collection}`),
  createMaster: (collection: string, data: any) =>
    request(`/master/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaster: (collection: string, id: string, data: any) =>
    request(`/master/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMaster: (collection: string, id: string) =>
    request(`/master/${collection}/${id}`, {
      method: 'DELETE',
    }),
  getActiveRegulation: () =>
    request<{ regulationYear: number; regulationCode: string }>('/master/regulation'),
  updateActiveRegulation: (data: { regulationYear: number; regulationCode: string }) =>
    request<{ message: string; regulationYear: number; regulationCode: string }>('/master/regulation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Programmes
  getProgrammes: () => request<any[]>('/programmes'),
  getReadinessReport: (code: string) => request<any>(`/programmes/${code}/readiness`),
  bundleProgrammeUrl: (code: string) => `/api/programmes/${code}/bundle`,
};
