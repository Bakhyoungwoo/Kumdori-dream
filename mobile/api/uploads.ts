import { request } from './client';
import type { PresignResponse } from './types';

export type LocalImage = { uri: string; fileName?: string | null; mimeType?: string | null };

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heic',
};

/** 서버가 허용하는 확장자(jpg·jpeg·png·webp·heic)로 파일 이름과 MIME을 맞춘다 */
function normalize(image: LocalImage) {
  const mimeType = (image.mimeType ?? 'image/jpeg').toLowerCase();
  const ext = EXT_BY_MIME[mimeType] ?? 'jpg';
  const base = (image.fileName ?? '').trim();
  const hasAllowedExt = /\.(jpe?g|png|webp|heic)$/i.test(base);
  const fileName = hasAllowedExt ? base.slice(-200) : `photo.${ext}`;
  return { fileName, contentType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg' };
}

export function presignUpload(fileName: string, contentType: string) {
  return request<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType }),
  });
}

/**
 * 로컬 이미지를 presigned URL로 업로드하고 objectKey(users/{userId}/inputs/...)를 돌려준다.
 * 작업 요청에는 로컬 URI가 아니라 이 key를 보낸다.
 */
export async function uploadImage(image: LocalImage): Promise<string> {
  const { fileName, contentType } = normalize(image);
  const { objectKey, uploadUrl } = await presignUpload(fileName, contentType);
  const blob = await (await fetch(image.uri)).blob();
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!put.ok) throw new Error(`이미지 업로드에 실패했어요 (${put.status}). 잠시 후 다시 시도해 주세요.`);
  return objectKey;
}
