// docs/DEVELOPMENT_PLAN.md API 명세 기준 타입

export type Artist = { id: number; name: string };

export type FrameSource = 'ARTIST' | 'USER_UPLOADED';

export type FrameSlot = {
  slotIndex: number;
  /** 슬롯에 들어갈 합성 대상(아티스트·인물) 미리보기 */
  targetPreviewUrl: string | null;
};

export type FrameSummary = {
  id: number;
  title: string;
  artistId: number | null;
  artistName: string | null;
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

export type Quota = { remaining: number; limit: number };
