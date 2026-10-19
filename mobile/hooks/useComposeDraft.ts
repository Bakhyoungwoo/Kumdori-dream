import { useSyncExternalStore } from 'react';
import type { LocalImage } from '@/api/uploads';

/** 프레임 선택 → 사진 입력 → 생성 설정 사이에서 유지되는 작성 중 상태 */
export type DraftPhoto = LocalImage & {
  /** 업로드가 끝나면 채워진다. 같은 사진으로 다시 요청할 때 재업로드하지 않는다 */
  objectKey?: string;
};

export type ComposeDraft = {
  frameId: string | null;
  /** 사용자 사진 1장. 캐릭터 이미지는 프레임의 것을 자동으로 쓴다 */
  photo: DraftPhoto | null;
};

let draft: ComposeDraft = { frameId: null, photo: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const composeDraft = {
  start(frameId: string) {
    // 다른 프레임으로 바뀔 때만 초기화 — 뒤로 갔다 와도 입력이 보존된다
    if (draft.frameId !== frameId) {
      draft = { frameId, photo: null };
      emit();
    }
  },
  setPhoto(photo: LocalImage) {
    draft = { ...draft, photo: { ...photo } };
    emit();
  },
  setUploadedKey(objectKey: string) {
    if (!draft.photo) return;
    draft = { ...draft, photo: { ...draft.photo, objectKey } };
    emit();
  },
  removePhoto() {
    draft = { ...draft, photo: null };
    emit();
  },
  reset() {
    draft = { frameId: null, photo: null };
    emit();
  },
};

export function useComposeDraft(): ComposeDraft {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => draft,
  );
}
