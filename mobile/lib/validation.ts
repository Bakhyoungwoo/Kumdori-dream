// 백엔드 AuthDtos 검증 규칙과 맞춘다 (@Email, password 8~72자, nickname 50자 이하)
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const NICKNAME_MAX = 50;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(v: string): string | null {
  if (!v.trim()) return '이메일을 입력해 주세요.';
  if (!EMAIL_RE.test(v.trim())) return '이메일 형식이 올바르지 않아요.';
  return null;
}

export function validatePassword(v: string): string | null {
  if (v.length < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`;
  if (v.length > PASSWORD_MAX) return `비밀번호는 ${PASSWORD_MAX}자 이하여야 해요.`;
  return null;
}

export function validateNickname(v: string): string | null {
  if (!v.trim()) return '닉네임을 입력해 주세요.';
  if (v.trim().length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MAX}자 이하여야 해요.`;
  return null;
}
