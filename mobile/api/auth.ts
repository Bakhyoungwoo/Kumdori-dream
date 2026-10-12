import { request } from './client';

export type TokenResponse = { accessToken: string; refreshToken: string; accessTokenExpiresIn: number };

export function login(email: string, password: string) {
  return request<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function signup(email: string, password: string, nickname: string) {
  return request<TokenResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, nickname }) });
}

export function refresh(refreshToken: string) {
  return request<TokenResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
}

export function logout(refreshToken: string) {
  return request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
}
