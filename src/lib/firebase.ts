import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

let currentUser: User | null = null;

export const getCurrentUser = () => currentUser;

export const setCurrentUser = (user: User | null) => {
  currentUser = user;
};

export const signInWithGoogle = async (credential: string) => {
  const response = await axios.post(`${API_URL}/auth/google`, { credential });
  const { token, user } = response.data;
  setAuthToken(token);
  setCurrentUser(user);
  return user;
};

export const logout = () => {
  clearAuthToken();
  setCurrentUser(null);
};

let authStateCallbacks: ((user: User | null) => void)[] = [];

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  authStateCallbacks.push(callback);
  const token = getAuthToken();

  if (token) {
    axios.get(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setCurrentUser(res.data.user);
      callback(res.data.user);
    }).catch(() => {
      clearAuthToken();
      callback(null);
    });
  } else {
    callback(null);
  }

  return () => {
    authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
  };
};