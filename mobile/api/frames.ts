import { request } from './client';
import type { Character, CreateJobRequest, CreateJobResponse, FrameDetail, FrameSource, FrameSummary, Quota } from './types';

type CharacterResponse = { id: string; name: string; profileImageKey: string | null };
type FrameResponse = {
  id: string;
  title: string;
  description: string | null;
  characterId: string | null;
  characterName: string | null;
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

export async function getFrames(params: { source: FrameSource; characterId?: string | null; query?: string }): Promise<FrameSummary[]> {
  const search = new URLSearchParams({ source: params.source });
  if (params.characterId) search.set('characterId', params.characterId);
  const response = await request<FrameResponse[]>(`/frames?${search.toString()}`);
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

export async function createJob(req: CreateJobRequest): Promise<CreateJobResponse> {
  return request<CreateJobResponse>('/jobs', { method: 'POST', body: JSON.stringify(req) });
}
