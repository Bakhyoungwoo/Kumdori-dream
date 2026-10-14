import { registerJob } from './gallery';
import type { Character, CreateJobRequest, CreateJobResponse, FrameDetail, FrameSummary, Quota } from './types';

// Mock API until core-api integration.
// GET /api/v1/characters, GET /api/v1/characters/{id}/frames,
// GET /api/v1/custom-targets, GET /api/v1/frames/{id}, POST /api/v1/jobs
const characters: Character[] = [
  { id: 1, name: '스텔라' },
  { id: 2, name: '노바' },
  { id: 3, name: '루미' },
];

const frames: FrameSummary[] = [
  { id: 101, title: '첫 팬미팅 네컷', characterId: 1, characterName: '스텔라', source: 'CHARACTER', slotCount: 4, usageCount: 12840, recommended: true, previewUrl: null, tints: ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'] },
  { id: 102, title: '무대 뒤 셀카', characterId: 1, characterName: '스텔라', source: 'CHARACTER', slotCount: 2, usageCount: 5210, recommended: false, previewUrl: null, tints: ['#FDE3D6', '#E4E2FB'] },
  { id: 201, title: '여름 바다 컷', characterId: 2, characterName: '노바', source: 'CHARACTER', slotCount: 4, usageCount: 8932, recommended: true, previewUrl: null, tints: ['#A8DCC6', '#B9C3F7', '#A8DCC6', '#B9C3F7'] },
  { id: 202, title: '생일 축하 프레임', characterId: 2, characterName: '노바', source: 'CHARACTER', slotCount: 3, usageCount: 3120, recommended: false, previewUrl: null, tints: ['#F9D68A', '#F7B9A6', '#F9D68A'] },
  { id: 301, title: '퇴근길 브이로그', characterId: 3, characterName: '루미', source: 'CHARACTER', slotCount: 4, usageCount: 2045, recommended: false, previewUrl: null, tints: ['#E4E2FB', '#FDE3D6', '#E4E2FB', '#FDE3D6'] },
  { id: 302, title: '응원봉 인증샷', characterId: 3, characterName: '루미', source: 'CHARACTER', slotCount: 1, usageCount: 1580, recommended: false, previewUrl: null, tints: ['#B9C3F7'] },
  { id: 901, title: '우리 가족 네컷', characterId: null, characterName: null, source: 'USER_UPLOADED', slotCount: 4, usageCount: 3, recommended: false, previewUrl: null, tints: ['#FDE3D6', '#F9D68A', '#FDE3D6', '#F9D68A'] },
];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCharacters(): Promise<Character[]> {
  await delay();
  return characters;
}

export async function getFrames(params: { source: 'CHARACTER' | 'USER_UPLOADED'; characterId?: number | null; query?: string }): Promise<FrameSummary[]> {
  await delay();
  const q = params.query?.trim().toLowerCase() ?? '';
  return frames.filter(
    (frame) =>
      frame.source === params.source &&
      (params.characterId == null || frame.characterId === params.characterId) &&
      (!q || frame.title.toLowerCase().includes(q) || (frame.characterName ?? '').toLowerCase().includes(q)),
  );
}

export async function getFrame(id: number): Promise<FrameDetail | null> {
  await delay();
  const frame = frames.find((item) => item.id === id);
  if (!frame) return null;
  return { ...frame, slots: Array.from({ length: frame.slotCount }, (_, i) => ({ slotIndex: i, targetPreviewUrl: null })) };
}

export async function getQuota(): Promise<Quota> {
  await delay(100);
  return { remaining: 10, limit: 10 };
}

export async function createJob(req: CreateJobRequest): Promise<CreateJobResponse> {
  await delay(400);
  const jobId = `mock-${Date.now()}`;
  const frame = frames.find((item) => item.id === req.frameId);
  registerJob(jobId, req, { title: frame?.title ?? '프레임', tints: frame?.tints ?? ['#FDE3D6'] });
  return { jobId, pipelineType: req.requirementText ? 'GENERATIVE' : 'CV' };
}
