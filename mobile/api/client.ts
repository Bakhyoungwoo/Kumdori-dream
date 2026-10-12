import { ACCESS_KEY, tokenStore } from './session';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

/** 백엔드 ErrorResponse(code, message)를 담는 오류. 화면에서 code로 분기한다 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const NETWORK_ERROR = 'NETWORK';

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = path.startsWith('/auth/') ? null : await tokenStore.get(ACCESS_KEY);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR, '서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요.');
  }
  if (!response.ok) {
    let code = `HTTP_${response.status}`;
    let message = '잠시 후 다시 시도해 주세요.';
    try {
      const body = await response.json();
      code = body.code ?? code;
      message = body.message ?? message;
    } catch {}
    throw new ApiError(response.status, code, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
