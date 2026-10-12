# assets

| 폴더 | 내용 |
| --- | --- |
| `illustrations/` | **원본 SVG**. 수정은 여기서 한다. |
| `images/` | `illustrations/`에서 렌더링한 PNG. 앱 아이콘, 스플래시, 공유 이미지 등 SVG를 못 쓰는 곳에 사용. |

- 앱 화면 안의 마스코트는 `components/Mascot.tsx`(react-native-svg)로 그린다. 포즈: `hello` · `strip` · `think` · `cheer`
- `*-decor.svg`는 주변 장식(색종이·반짝이, think는 점선 궤도) 포함 버전
- 색은 `theme/tokens.ts`와 같다. 원본 SVG를 고치면 PNG도 다시 뽑는다.
