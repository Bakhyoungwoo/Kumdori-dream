// docs/DEVELOPMENT_PLAN.md API 명세 기준 타입

export type Character = { id: string; name: string; profileImageKey?: string | null };

/** 사용자 프레임(USER_UPLOADED)은 지원하지 않는다. 공식 캐릭터 프레임만 사용 */
export type FrameSource = 'CHARACTER';

export type FrameSlot = {
  slotIndex: number;
  targetImageKey: string;
  analysis: string | null;
  /** 슬롯에 들어갈 합성 대상(아티스트·인물) 미리보기 */
  targetPreviewUrl: string | null;
};

export type FrameSummary = {
  id: string;
  title: string;
  characterId: string | null;
  characterName: string | null;
  /** 생성 요청 시 두 번째 입력으로 그대로 보내는 캐릭터 이미지 key */
  characterProfileImageKey: string | null;
  characterProfileImageUrl: string | null;
  source: FrameSource;
  slotCount: number;
  usageCount: number;
  recommended: boolean;
  previewUrl: string | null;
  /** 미리보기 이미지가 없을 때 쓰는 슬롯별 배경색 (목업용) */
  tints: string[];
};

export type FrameDetail = FrameSummary & { slots: FrameSlot[] };

export type PipelineType = 'CV' | 'GENERATIVE';

export type JobInput = { slotIndex: number; userImageKey: string };

/** POST /api/v1/jobs (backend JobDtos.CreateJobRequest) */
export type CreateJobRequest = {
  frameId: string | null;
  pipelineType: PipelineType;
  /** GENERATIVE는 필수 */
  requirementText?: string;
  /** 1~4, 기본 1 */
  imageCount?: number;
  /** 프레임 생성형: [사용자 사진(users/...), 캐릭터 이미지] 2개 */
  inputs: JobInput[];
};

export type JobStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' | 'ENGINE_TIMEOUT' | 'CANCELED';

/** backend JobDtos.JobResponse — 작업 ID는 `id` */
export type JobResponse = {
  id: string;
  frameId: string | null;
  status: JobStatus;
  pipelineType: PipelineType;
  mediaType: 'IMAGE' | 'VIDEO';
  requirementText: string | null;
  imageCount: number;
  progress: number;
  errorCode: string | null;
  results: { resultKey: string; thumbnailKey: string | null; width: number | null; height: number | null }[];
  createdAt: string;
  updatedAt: string;
};

/** POST /api/v1/uploads/presign */
export type PresignResponse = { objectKey: string; uploadUrl: string; expiresInSeconds: number };

/** 생성형(GENERATIVE) 합성의 오늘 남은 **이미지 장수**. 기본 합성(CV)은 쿼터를 쓰지 않는다 */
export type Quota = { remaining: number; limit: number };

export type GalleryKind = 'PHOTO' | 'VIDEO';
export type GalleryStatus = 'PROCESSING' | 'DONE' | 'FAILED';

/** 갤러리 목록 항목 (잡 단위). GET /api/v1/jobs + GET /api/v1/gallery */
export type GalleryItem = {
  id: string;
  title: string;
  kind: GalleryKind;
  pipeline: PipelineType;
  status: GalleryStatus;
  progress: number;
  imageCount: number;
  createdAt: string;
  /** 썸네일이 없을 때 쓰는 목업용 배경색 (네컷이면 슬롯별) */
  tints: string[];
  thumbnailUrl: string | null;
  failureReason?: string;
  durationSec?: number;
  requirementText?: string;
};

export type ResultImage = { url: string | null; tint: string; format: 'PNG' | 'MP4'; sizeBytes: number | null };

/** 결과 상세. GET /api/v1/jobs/{id} + GET /api/v1/gallery */
export type ResultDetail = GalleryItem & { images: ResultImage[]; frameId: string | number | null };
