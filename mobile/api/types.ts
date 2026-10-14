// docs/DEVELOPMENT_PLAN.md API 명세 기준 타입

export type Character = { id: number; name: string };

export type FrameSource = 'CHARACTER' | 'USER_UPLOADED';

export type FrameSlot = {
  slotIndex: number;
  /** 슬롯에 들어갈 합성 대상(아티스트·인물) 미리보기 */
  targetPreviewUrl: string | null;
};

export type FrameSummary = {
  id: number;
  title: string;
  characterId: number | null;
  characterName: string | null;
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

export type CreateJobRequest = {
  frameId: number;
  inputs: { slotIndex: number; userImageKey: string }[];
  /** 있으면 GENERATIVE, 없으면 CV */
  requirementText?: string;
  /** GENERATIVE 전용, 1~4 */
  imageCount?: number;
};

export type CreateJobResponse = { jobId: string; pipelineType: PipelineType };

/** 생성형(GENERATIVE) 합성의 오늘 남은 **이미지 장수**. 기본 합성(CV)은 쿼터를 쓰지 않는다 */
export type Quota = { remaining: number; limit: number };

export type GalleryKind = 'PHOTO' | 'VIDEO';
export type GalleryStatus = 'PROCESSING' | 'DONE' | 'FAILED';

/** 갤러리 목록 항목 (잡 단위). GET /api/v1/gallery */
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

export type ResultImage = { url: string | null; tint: string; format: 'PNG' | 'MP4'; sizeBytes: number };

/** 결과 상세. GET /api/v1/gallery/{resultId} */
export type ResultDetail = GalleryItem & { images: ResultImage[]; frameId: number | null };
