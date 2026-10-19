import { request } from './client';
import type { Character, CreateJobRequest, FrameDetail, FrameSource, FrameSummary, JobResponse, Quota } from './types';

type CharacterResponse = { id: string; name: string; profileImageKey: string | null };
type FrameResponse = {
  id: string;
  title: string;
  description: string | null;
  characterId: string | null;
  characterName: string | null;
  characterProfileImageKey: string | null;
  characterProfileImageUrl: string | null;
  source: FrameSource;
  templateKey: string;
  templatePreviewUrl: string | null;
  slotCount: number;
  usageCount: number;
  slots: { slotIndex: number; targetImageKey: string; targetPreviewUrl: string | null; analysis: string | null }[];
};

const toCharacter = (item: CharacterResponse): Character => item;
const toFrame = (item: FrameResponse): FrameSummary => ({
  ...item,
  recommended: false,
  previewUrl: item.templatePreviewUrl,
  tints: ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'].slice(0, item.slotCount),
});

export async function getCharacters(): Promise<Character[]> {
  const response = await request<CharacterResponse[]>('/characters');
  return response.map(toCharacter);
}

/** 공식 캐릭터 프레임만 조회한다 (서버도 CHARACTER 프레임만 반환) */
export async function getFrames(params: { characterId?: string | null; query?: string } = {}): Promise<FrameSummary[]> {
  const search = new URLSearchParams();
  if (params.characterId) search.set('characterId', params.characterId);
  const qs = search.toString();
  const response = await request<FrameResponse[]>(`/frames${qs ? `?${qs}` : ''}`);
  const query = params.query?.trim().toLowerCase() ?? '';
  return response.map(toFrame).filter((frame) => !query || frame.title.toLowerCase().includes(query) || (frame.characterName ?? '').toLowerCase().includes(query));
}

export async function getFrame(id: string): Promise<FrameDetail | null> {
  const response = await request<FrameResponse>(`/frames/${id}`);
  return {
    ...toFrame(response),
    slots: response.slots.map((slot) => ({
      ...slot,
      // Storage URL 발급 API가 추가되기 전까지는 key만 보존한다.
      targetPreviewUrl: slot.targetPreviewUrl,
    })),
  };
}

export async function getQuota(): Promise<Quota> {
  return request<Quota>('/users/me/quota');
}

const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

/** 작업 생성. 응답의 작업 ID는 `id` */
export async function createJob(req: CreateJobRequest, idempotencyKey = newIdempotencyKey()): Promise<JobResponse> {
  return request<JobResponse>('/jobs', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(req),
  });
}
