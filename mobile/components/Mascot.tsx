import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export type MascotPose = 'hello' | 'strip' | 'think' | 'cheer';

type Props = {
  pose?: MascotPose;
  size?: number;
  /** 주변 장식(색종이·반짝이) 표시 여부 */
  decor?: boolean;
  /** 접근성 설명. 없으면 장식 이미지로 취급 */
  label?: string;
};

const INK = colors.ink;
const BODY = '#FFFDF8';
const CHEEK = '#FFB4A2';

/** OURCUT 마스코트 (가칭 꿈컷이) — viewBox 240×240 */
export function Mascot({ pose = 'hello', size = 200, decor = false, label }: Props) {
  const lensY = pose === 'cheer' ? 172 : 170;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {decor && <Decor pose={pose} />}

      <Ellipse cx={120} cy={226} rx={60} ry={7} fill={INK} opacity={0.08} />
      <Ellipse cx={96} cy={214} rx={17} ry={9} fill={colors.pop} stroke={INK} strokeWidth={3.5} />
      <Ellipse cx={144} cy={214} rx={17} ry={9} fill={colors.pop} stroke={INK} strokeWidth={3.5} />

      <Path d="M120 34 C116 44 124 50 120 60" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <Path
        d="M120 4 L126 16 L139 18 L129.5 27 L132 40 L120 34 L108 40 L110.5 27 L101 18 L114 16 Z"
        fill={colors.star}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Path
        d="M120 58 C170 58 192 96 192 142 C192 190 162 212 120 212 C78 212 48 190 48 142 C48 96 70 58 120 58 Z"
        fill={BODY}
        stroke={INK}
        strokeWidth={4}
      />

      <Circle cx={120} cy={lensY} r={19} fill={colors.primary} stroke={INK} strokeWidth={3.5} />
      <Circle cx={120} cy={lensY} r={8} fill={INK} />
      <Circle cx={114} cy={lensY - 6} r={3} fill="#FFFFFF" />

      <Face pose={pose} />
      <Arms pose={pose} />
    </Svg>
  );
}

function Face({ pose }: { pose: MascotPose }) {
  const cheeks = (
    <>
      <Ellipse cx={85} cy={137} rx={9} ry={5} fill={CHEEK} />
      <Ellipse cx={155} cy={137} rx={9} ry={5} fill={CHEEK} />
    </>
  );

  if (pose === 'cheer') {
    return (
      <>
        <Path d="M93 122 Q100 112 107 122" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <Path d="M133 122 Q140 112 147 122" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        {cheeks}
        <Path d="M110 132 Q120 150 130 132 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </>
    );
  }

  const eyeY = pose === 'think' ? 114 : 120;
  const eyeDx = pose === 'think' ? 3 : 0;
  return (
    <>
      <Ellipse cx={100 + eyeDx} cy={eyeY} rx={6} ry={8} fill={INK} />
      <Ellipse cx={140 + eyeDx} cy={eyeY} rx={6} ry={8} fill={INK} />
      <Circle cx={102 + eyeDx} cy={eyeY - 3} r={2} fill="#FFFFFF" />
      <Circle cx={142 + eyeDx} cy={eyeY - 3} r={2} fill="#FFFFFF" />
      {cheeks}
      {pose === 'think' ? (
        <Circle cx={120} cy={139} r={4.5} fill={INK} />
      ) : (
        <Path d="M112 134 Q120 142 128 134" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      )}
    </>
  );
}

function Arms({ pose }: { pose: MascotPose }) {
  const arm = { fill: 'none', stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const };
  const hand = { r: 8, fill: BODY, stroke: INK, strokeWidth: 3.5 };
  const restLeft = <Path d="M52 150 C38 158 36 172 48 180" {...arm} />;

  switch (pose) {
    case 'hello':
      return (
        <>
          {restLeft}
          <Path d="M188 124 C202 112 206 96 202 84" {...arm} />
          <Circle cx={201} cy={80} {...hand} />
        </>
      );
    case 'strip':
      return (
        <>
          {restLeft}
          <G rotation={10} origin="200, 140">
            <Rect x={182} y={92} width={38} height={92} rx={6} fill={colors.primary} stroke={INK} strokeWidth={3.5} />
            <Rect x={188} y={99} width={26} height={22} rx={3} fill={colors.cream} />
            <Rect x={188} y={126} width={26} height={22} rx={3} fill={colors.cream} />
            <Rect x={188} y={153} width={26} height={22} rx={3} fill={colors.cream} />
          </G>
          <Circle cx={186} cy={150} {...hand} />
        </>
      );
    case 'think':
      return (
        <>
          <Path d="M54 148 C66 160 84 168 96 166" {...arm} />
          <Path d="M186 148 C174 160 156 168 144 166" {...arm} />
          <Circle cx={100} cy={166} {...hand} r={7.5} />
          <Circle cx={140} cy={166} {...hand} r={7.5} />
        </>
      );
    case 'cheer':
      return (
        <>
          <Path d="M56 120 C42 104 40 88 46 76" {...arm} />
          <Path d="M184 120 C198 104 200 88 194 76" {...arm} />
          <Circle cx={46} cy={72} {...hand} />
          <Circle cx={194} cy={72} {...hand} />
        </>
      );
  }
}

function Decor({ pose }: { pose: MascotPose }) {
  if (pose === 'think') {
    return (
      <Circle
        cx={120}
        cy={132}
        r={108}
        fill="none"
        stroke={colors.primary}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="1 16"
      />
    );
  }
  return (
    <>
      <Path d="M14 200 q10 -12 20 0 t20 0" fill="none" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={34} cy={62} r={5} fill={colors.pop} />
      <Circle cx={24} cy={108} r={4} fill={colors.star} />
      <Circle cx={222} cy={206} r={5} fill="#FF8FA3" />
      <Path d="M204 26 Q206 36 216 38 Q206 40 204 50 Q202 40 192 38 Q202 36 204 26 Z" fill={colors.primary} />
    </>
  );
}
