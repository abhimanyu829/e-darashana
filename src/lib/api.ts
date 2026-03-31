import axios, { AxiosHeaders } from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (!user) {
    return config;
  }

  const token = await user.getIdToken();
  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
  return config;
});

export const courseApi = {
  getCourses: () => api.get('/courses'),
  createCourse: (data: any) => api.post('/courses', data),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
  getTopics: (id: string) => api.get(`/courses/${id}/topics`),
};

export const syllabusApi = {
  uploadSyllabus: (data: any) => api.post('/syllabus/upload', data),
  parseSyllabus: (syllabusId: string) => api.post(`/syllabus/parse/${syllabusId}`),
};

export const taskApi = {
  getTodayTasks: (courseId?: string, section?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (section) params.append('section', section);
    return api.get(`/tasks/today?${params.toString()}`);
  },
  updateTaskStatus: (date: string, taskId: string, checkbox: boolean) =>
    api.patch('/tasks/status', { date, taskId, checkbox }),
};

export const activityApi = {
  getActivityLogs: (section: string) => api.get(`/activity?section=${section}`),
};

// ── Notification API (new — no existing exports changed) ─────────────────────
export const notificationApi = {
  getVapidPublicKey: () => api.get('/notifications/vapid-public-key'),
  subscribe: (subscription: object) => api.post('/notifications/subscribe', { subscription }),
  unsubscribe: (endpoint: string) => api.delete('/notifications/unsubscribe', { data: { endpoint } }),
};

export default api;
