export function formatRelative(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  if (h < 48) return '어제';
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function formatBytes(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}MB` : `${Math.round(n / 1000)}KB`;
}

export function formatDuration(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/** 받침 유무에 따라 '와/과'를 붙인다. 예: withParticle('루미') → '루미와' */
export function withParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}와`;
  return `${word}${code % 28 === 0 ? '와' : '과'}`;
}
