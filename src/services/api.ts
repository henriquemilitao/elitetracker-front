import axios, { AxiosError } from 'axios';

import { userLocalStorageKey } from '../hooks/use-user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const userData = localStorage.getItem(userLocalStorageKey);

  const token = userData && JSON.parse(userData).token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function isAxiosError<T = any>(error: unknown): error is AxiosError<T> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
