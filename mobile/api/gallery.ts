import type { CreateJobRequest, GalleryItem, GalleryKind, GalleryStatus, ResultDetail } from './types';

// TODO: core-api 연동 전 목업.
//  GET /api/v1/gallery, GET /api/v1/gallery/{id}, DELETE /api/v1/gallery/{id}, POST /api/v1/jobs(재시도·다시 생성)

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

type Stored = ResultDetail;

let items: Stored[] = [
  {
    id: 'job-fail-1', title: '여름 바다 컷', kind: 'PHOTO', pipeline: 'CV', status: 'FAILED', progress: 40, imageCount: 1,
    createdAt: minutesAgo(10), tints: ['#A8DCC6', '#B9C3F7', '#A8DCC6', '#B9C3F7'], thumbnailUrl: null,
    failureReason: '얼굴을 찾지 못했어요', frameId: 201, images: [],
  },
  {
    id: 'job-cv-1', title: '첫 팬미팅 네컷', kind: 'PHOTO', pipeline: 'CV', status: 'DONE', progress: 100, imageCount: 1,
    createdAt: minutesAgo(60 * 20), tints: ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'], thumbnailUrl: null, frameId: 101,
    images: [{ url: null, tint: '#F7B9A6', format: 'PNG', sizeBytes: 2_400_000 }],
  },
  {
    id: 'job-gen-1', title: '벚꽃 공원 무드', kind: 'PHOTO', pipeline: 'GENERATIVE', status: 'DONE', progress: 100, imageCount: 4,
    createdAt: minutesAgo(60 * 48), tints: ['#F2C7D4'], thumbnailUrl: null, frameId: 101,
    requirementText: '벚꽃이 흩날리는 봄 공원에서 같이 웃고 있는 느낌으로, 따뜻한 필름 색감',
    images: ['#F2C7D4', '#F9D68A', '#B9C3F7', '#A8DCC6'].map((tint) => ({ url: null, tint, format: 'PNG' as const, sizeBytes: 3_100_000 })),
  },
  {
    id: 'job-video-1', title: '챌린지 영상', kind: 'VIDEO', pipeline: 'CV', status: 'DONE', progress: 100, imageCount: 1,
    createdAt: minutesAgo(60 * 72), tints: ['#B9C3F7'], thumbnailUrl: null, durationSec: 15, frameId: null,
    images: [{ url: null, tint: '#B9C3F7', format: 'MP4', sizeBytes: 8_200_000 }],
  },
  {
    id: 'job-cv-2', title: '무대 뒤 셀카', kind: 'PHOTO', pipeline: 'CV', status: 'DONE', progress: 100, imageCount: 1,
    createdAt: minutesAgo(60 * 96), tints: ['#FDE3D6', '#E4E2FB'], thumbnailUrl: null, frameId: 102,
    images: [{ url: null, tint: '#FDE3D6', format: 'PNG', sizeBytes: 1_900_000 }],
  },
];

const summary = ({ images, frameId, ...rest }: Stored): GalleryItem => rest;

export async function getGallery(params: { kind?: GalleryKind | null; status?: GalleryStatus | null } = {}): Promise<GalleryItem[]> {
  await delay();
  return items
    .filter((i) => (!params.kind || i.kind === params.kind) && (!params.status || i.status === params.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(summary);
}

export async function getResult(id: string): Promise<ResultDetail | null> {
  await delay();
  return items.find((i) => i.id === id) ?? null;
}

export async function deleteResults(ids: string[]): Promise<void> {
  await delay(300);
  items = items.filter((i) => !ids.includes(i.id));
}

/** 생성 요청이 접수되면 갤러리에 '생성 중' 항목을 만든다 (서버에서는 잡 생성과 동시에 조회 가능) */
export function registerJob(jobId: string, req: CreateJobRequest, meta: { title: string; tints: string[] }) {
  const generative = !!req.requirementText;
  items = [
    {
      id: jobId, title: meta.title, kind: 'PHOTO', pipeline: generative ? 'GENERATIVE' : 'CV', status: 'PROCESSING', progress: 0,
      imageCount: generative ? (req.imageCount ?? 1) : 1, createdAt: new Date().toISOString(),
      tints: generative ? [meta.tints[0]] : meta.tints, thumbnailUrl: null, requirementText: req.requirementText,
      frameId: req.frameId, images: [],
    },
    ...items,
  ];
}

/** 목업 진행률 반영. 실제로는 SSE 이벤트로 서버 상태가 바뀐다 */
export function updateMockJob(jobId: string, progress: number) {
  items = items.map((i) => {
    if (i.id !== jobId) return i;
    if (progress < 100) return { ...i, progress };
    const tints = i.pipeline === 'GENERATIVE' ? ['#F2C7D4', '#F9D68A', '#B9C3F7', '#A8DCC6'].slice(0, i.imageCount) : [i.tints[0]];
    return { ...i, status: 'DONE', progress: 100, images: tints.map((tint) => ({ url: null, tint, format: 'PNG', sizeBytes: 2_600_000 })) };
  });
}

/** 실패한 잡 다시 시도: 같은 항목을 '생성 중'으로 되돌린다 */
export async function retryJob(id: string): Promise<void> {
  await delay(300);
  items = items.map((i) => (i.id === id ? { ...i, status: 'PROCESSING', progress: 0, failureReason: undefined } : i));
}
