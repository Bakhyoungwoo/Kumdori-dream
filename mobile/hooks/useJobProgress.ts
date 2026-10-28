import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { getJob, isFinished } from '@/api/gallery';
import type { JobResponse } from '@/api/types';

const INTERVAL_MS = 1500;

/**
 * 작업이 끝날 때까지 서버 상태를 주기적으로 조회한다.
 * TODO: GET /api/v1/jobs/{id}/stream (SSE)으로 교체. React Native에는 EventSource가 없고 인증 헤더도 붙여야 해서
 *  같은 JobResponse를 돌려주는 단건 조회로 먼저 연결했다.
 */
export function useJobProgress(id: string) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const next = await getJob(id);
        if (!alive) return;
        setJob(next);
        setError(null);
        if (isFinished(next.status)) return;
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '진행 상태를 불러오지 못했어요.');
        if (e instanceof ApiError && e.status === 404) return; // 없는 작업은 다시 조회해도 소용없다
      }
      timer = setTimeout(tick, INTERVAL_MS);
    }

    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  return { job, error };
}
