// OURCUT 디자인 토큰 — 디자인 보드(V LIVE 구조 × PlayMo 온기) 기준
export const colors = {
  primary: '#F26B3A', // CTA 면, 아이콘, 일러스트
  primaryText: '#C94A1C', // 흰 배경 위 주황 글자 (4.5:1 이상)
  primaryPressed: '#D9572A',
  primarySoft: '#FFE8DC', // 배지, 선택된 칩
  primaryBorder: '#F2B79F', // 비선택 칩 테두리
  cream: '#FFF4E8', // 온보딩·생성 진행·빈 상태 전용
  bg: '#FFFFFF', // 탐색 화면
  surface: '#F6F6F8',
  border: '#ECECF0',
  borderWarm: '#E6DCD3',
  bgDark: '#1C1C1E', // 결과 상세·플레이어
  surfaceDark: '#2A2A2D',
  ink: '#2B1D16', // 본문, CTA 글자, 일러스트 라인
  inkSub: '#6B5A50',
  white: '#FFFFFF',
  cardPhoto: '#FDE3D6',
  cardPhotoInk: '#6B4A3A',
  cardVideo: '#E4E2FB',
  cardVideoInk: '#4A4580',
  pop: '#5B6CFF', // 일러스트 전용
  star: '#FFC83D',
  success: '#2FA36B',
  danger: '#E5484D',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, pill: 999 } as const;

export const layout = {
  /** 태블릿·웹에서 콘텐츠가 과하게 늘어나지 않도록 하는 최대 폭 */
  maxContentWidth: 560,
  /** 로그인처럼 단일 컬럼 화면의 최대 폭 */
  maxFormWidth: 430,
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const fonts = {
  display: 'Jua_400Regular', // 감정 헤드라인 전용 (온보딩·진행·완료)
  regular: 'IBMPlexSansKR_400Regular',
  medium: 'IBMPlexSansKR_500Medium',
  semibold: 'IBMPlexSansKR_600SemiBold',
  bold: 'IBMPlexSansKR_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 35, color: colors.ink },
  h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 26, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.ink },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.inkSub },
} as const;

export const shadow = {
  cta: {
    shadowColor: colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;
