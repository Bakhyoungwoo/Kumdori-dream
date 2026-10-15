import { useSyncExternalStore } from 'react';

/** 프레임 선택 → 사진 입력 → 생성 설정 사이에서 유지되는 작성 중 상태 */
export type ComposeDraft = {
  frameId: string | null;
  /** slotIndex → 로컬 이미지 URI */
  photos: Record<number, string>;
};

let draft: ComposeDraft = { frameId: null, photos: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const composeDraft = {
  start(frameId: string) {
    // 다른 프레임으로 바뀔 때만 초기화 — 뒤로 갔다 와도 입력이 보존된다
    if (draft.frameId !== frameId) {
      draft = { frameId, photos: {} };
      emit();
    }
  },
  setPhoto(slotIndex: number, uri: string) {
    draft = { ...draft, photos: { ...draft.photos, [slotIndex]: uri } };
    emit();
  },
  removePhoto(slotIndex: number) {
    const { [slotIndex]: _, ...rest } = draft.photos;
    draft = { ...draft, photos: rest };
    emit();
  },
  reset() {
    draft = { frameId: null, photos: {} };
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
