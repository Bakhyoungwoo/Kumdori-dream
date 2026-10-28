import { ApiError, request } from './client';
import type { GalleryItem, GalleryKind, GalleryStatus, JobResponse, JobStatus, ResultDetail, ResultImage } from './types';

/** GET /api/v1/gallery — 완료된 작업의 결과 1장당 항목 1개 (backend GalleryDtos.Item) */
type GalleryApiItem = {
  jobId: string;
  frameId: string | null;
  resultKey: string;
  thumbnailKey: string | null;
  resultPreviewUrl: string | null;
  thumbnailPreviewUrl: string | null;
  createdAt: string | null;
};

// 서버에는 제목·썸네일 색이 없다. 이미지가 없을 때만 쓰는 배경색
const TINTS = ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'];
const tintOf = (id: string) => TINTS[id.charCodeAt(0) % TINTS.length];

function toStatus(status: JobStatus): GalleryStatus {
  if (status === 'DONE') return 'DONE';
  if (status === 'FAILED' || status === 'ENGINE_TIMEOUT' || status === 'CANCELED') return 'FAILED';
  return 'PROCESSING';
}

/** 더 이상 상태가 바뀌지 않는 작업인지 */
export const isFinished = (status: JobStatus) => toStatus(status) !== 'PROCESSING';

/** 실패·취소된 작업을 사용자에게 보여줄 문구 */
export function failureText(job: Pick<JobResponse, 'status'>): string {
  if (job.status === 'ENGINE_TIMEOUT') return '생성 시간이 너무 오래 걸렸어요';
  if (job.status === 'CANCELED') return '취소된 작업이에요';
  return '잠시 후 다시 시도해 주세요';
}

function titleOf(job: JobResponse) {
  const text = job.requirementText?.trim();
  if (text) return text.length > 20 ? `${text.slice(0, 20)}…` : text;
  return job.mediaType === 'VIDEO' ? '내 영상' : '내 AI 네컷';
}

function toItem(job: JobResponse, previews: GalleryApiItem[] = []): GalleryItem {
  const kind: GalleryKind = job.mediaType === 'VIDEO' ? 'VIDEO' : 'PHOTO';
  const status = toStatus(job.status);
  const first = previews[0];
  return {
    id: job.id,
    title: titleOf(job),
    kind,
    pipeline: job.pipelineType,
    status,
    progress: status === 'DONE' ? 100 : job.progress,
    imageCount: job.imageCount,
    createdAt: job.createdAt,
    tints: kind === 'PHOTO' && job.pipelineType === 'CV' ? TINTS : [tintOf(job.id)],
    thumbnailUrl: first?.thumbnailPreviewUrl ?? first?.resultPreviewUrl ?? null,
    failureReason: status === 'FAILED' ? failureText(job) : undefined,
    requirementText: job.requirementText ?? undefined,
  };
}

async function fetchPreviews(): Promise<Map<string, GalleryApiItem[]>> {
  const rows = await request<GalleryApiItem[]>('/gallery');
  const byJob = new Map<string, GalleryApiItem[]>();
  for (const row of rows) {
    const list = byJob.get(row.jobId);
    if (list) list.push(row);
    else byJob.set(row.jobId, [row]);
  }
  return byJob;
}

/** 작업 1건 조회. 생성 진행 화면이 주기적으로 호출한다 */
export function getJob(id: string): Promise<JobResponse> {
  return request<JobResponse>(`/jobs/${id}`);
}

/** 내 작업 전체(생성 중·실패 포함)에 완료된 결과의 이미지 주소를 붙여 갤러리 목록으로 만든다 */
export async function getGallery(params: { kind?: GalleryKind | null; status?: GalleryStatus | null } = {}): Promise<GalleryItem[]> {
  const [jobs, previews] = await Promise.all([request<JobResponse[]>('/jobs'), fetchPreviews()]);
  return jobs
    .map((job) => toItem(job, previews.get(job.id)))
    .filter((i) => (!params.kind || i.kind === params.kind) && (!params.status || i.status === params.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getResult(id: string): Promise<ResultDetail | null> {
  try {
    const [job, previews] = await Promise.all([getJob(id), fetchPreviews()]);
    const rows = previews.get(id) ?? [];
    const format: ResultImage['format'] = job.mediaType === 'VIDEO' ? 'MP4' : 'PNG';
    const urls = rows.length > 0 ? rows.map((r) => r.resultPreviewUrl) : job.results.map(() => null);
    const images: ResultImage[] = urls.map((url, i) => ({ url, tint: TINTS[i % TINTS.length], format, sizeBytes: null }));
    return { ...toItem(job, rows), images, frameId: job.frameId };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// TODO: 서버에 완료된 결과를 지우는 API가 생기면 연결한다. DELETE /api/v1/jobs/{id}는 진행 중 작업의 취소용이다
export async function deleteResults(_ids: string[]): Promise<void> {
  throw new Error('결과 삭제는 아직 지원하지 않아요.');
}

// TODO: 원래 작업의 입력을 서버가 재사용하는 API가 생기면 연결한다
export async function retryJob(_id: string): Promise<void> {
  throw new Error('다시 시도는 아직 지원하지 않아요.');
}
