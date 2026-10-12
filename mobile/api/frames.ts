import { registerJob } from './gallery';
import type { Artist, CreateJobRequest, CreateJobResponse, FrameDetail, FrameSummary, Quota } from './types';

// TODO: core-api 연동 전까지 쓰는 목업. 함수 시그니처는 실제 API와 맞춰 두었다.
//  GET /api/v1/artists, GET /api/v1/artists/{id}/frames, GET /api/v1/custom-targets,
//  GET /api/v1/frames/{id}, POST /api/v1/jobs, GET /api/v1/users/me/quota

const artists: Artist[] = [
  { id: 1, name: '스텔라' },
  { id: 2, name: '노바' },
  { id: 3, name: '루미' },
];

const frames: FrameSummary[] = [
  { id: 101, title: '첫 팬미팅 네컷', artistId: 1, artistName: '스텔라', source: 'ARTIST', slotCount: 4, usageCount: 12840, recommended: true, previewUrl: null, tints: ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'] },
  { id: 102, title: '무대 뒤 셀카', artistId: 1, artistName: '스텔라', source: 'ARTIST', slotCount: 2, usageCount: 5210, recommended: false, previewUrl: null, tints: ['#FDE3D6', '#E4E2FB'] },
  { id: 201, title: '여름 바다 컷', artistId: 2, artistName: '노바', source: 'ARTIST', slotCount: 4, usageCount: 8932, recommended: true, previewUrl: null, tints: ['#A8DCC6', '#B9C3F7', '#A8DCC6', '#B9C3F7'] },
  { id: 202, title: '생일 축하 프레임', artistId: 2, artistName: '노바', source: 'ARTIST', slotCount: 3, usageCount: 3120, recommended: false, previewUrl: null, tints: ['#F9D68A', '#F7B9A6', '#F9D68A'] },
  { id: 301, title: '퇴근길 브이로그', artistId: 3, artistName: '루미', source: 'ARTIST', slotCount: 4, usageCount: 2045, recommended: false, previewUrl: null, tints: ['#E4E2FB', '#FDE3D6', '#E4E2FB', '#FDE3D6'] },
  { id: 302, title: '응원봉 인증샷', artistId: 3, artistName: '루미', source: 'ARTIST', slotCount: 1, usageCount: 1580, recommended: false, previewUrl: null, tints: ['#B9C3F7'] },
  { id: 901, title: '우리 가족 네컷', artistId: null, artistName: null, source: 'USER_UPLOADED', slotCount: 4, usageCount: 3, recommended: false, previewUrl: null, tints: ['#FDE3D6', '#F9D68A', '#FDE3D6', '#F9D68A'] },
];

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function getArtists(): Promise<Artist[]> {
  await delay();
  return artists;
}

export async function getFrames(params: { source: 'ARTIST' | 'USER_UPLOADED'; artistId?: number | null; query?: string }): Promise<FrameSummary[]> {
  await delay();
  const q = params.query?.trim().toLowerCase() ?? '';
  return frames.filter(
    (f) =>
      f.source === params.source &&
      (params.artistId == null || f.artistId === params.artistId) &&
      (!q || f.title.toLowerCase().includes(q) || (f.artistName ?? '').toLowerCase().includes(q)),
  );
}

export async function getFrame(id: number): Promise<FrameDetail | null> {
  await delay();
  const f = frames.find((x) => x.id === id);
  if (!f) return null;
  return { ...f, slots: Array.from({ length: f.slotCount }, (_, i) => ({ slotIndex: i, targetPreviewUrl: null })) };
}

export async function getQuota(): Promise<Quota> {
  await delay(100);
  // 계획서 기준: 사용자당 하루 10장, 요청 시 imageCount만큼 선차감
  return { remaining: 10, limit: 10 };
}

export async function createJob(req: CreateJobRequest): Promise<CreateJobResponse> {
  await delay(400);
  const jobId = `mock-${Date.now()}`;
  const frame = frames.find((f) => f.id === req.frameId);
  registerJob(jobId, req, { title: frame?.title ?? '네컷', tints: frame?.tints ?? ['#FDE3D6'] });
  return { jobId, pipelineType: req.requirementText ? 'GENERATIVE' : 'CV' };
}
