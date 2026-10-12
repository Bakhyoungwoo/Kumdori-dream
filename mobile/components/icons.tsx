import { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type IconProps = { size?: number; color?: ColorValue; filled?: boolean };

const stroke = (color: ColorValue) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size = 24, color = colors.inkSub, filled }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 10.5L12 4l8 6.5V20h-5v-5H9v5H4z" {...stroke(color)} fill={filled ? colors.primary : 'none'} />
    </Svg>
  );
}

export function FrameIcon({ size = 24, color = colors.inkSub, filled }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={7} y={3} width={10} height={18} rx={2} {...stroke(color)} fill={filled ? colors.primarySoft : 'none'} />
      <Path d="M7 9h10M7 15h10" {...stroke(color)} />
    </Svg>
  );
}

export function GalleryIcon({ size = 24, color = colors.inkSub, filled }: IconProps) {
  const f = filled ? colors.primarySoft : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={8} height={8} rx={2} {...stroke(color)} fill={f} />
      <Rect x={13} y={3} width={8} height={8} rx={2} {...stroke(color)} fill={f} />
      <Rect x={3} y={13} width={8} height={8} rx={2} {...stroke(color)} fill={f} />
      <Rect x={13} y={13} width={8} height={8} rx={2} {...stroke(color)} fill={f} />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = colors.inkSub, filled }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} {...stroke(color)} fill={filled ? colors.primarySoft : 'none'} />
      <Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" {...stroke(color)} />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" {...stroke(color)} />
      <Path d="M10 20a2 2 0 0 0 4 0" {...stroke(color)} />
    </Svg>
  );
}

export function StarIcon({ size = 16, color = colors.primaryText }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" {...stroke(color)} strokeWidth={2} />
    </Svg>
  );
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4" />
      <Path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
      <Path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05" />
      <Path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" fill="#EA4335" />
    </Svg>
  );
}

export function BackIcon({ size = 24, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" {...stroke(color)} strokeWidth={2} />
    </Svg>
  );
}

export function SearchIcon({ size = 20, color = colors.inkSub }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={7} {...stroke(color)} />
      <Path d="M20 20l-4-4" {...stroke(color)} />
    </Svg>
  );
}

export function CameraIcon({ size = 20, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" {...stroke(color)} />
      <Circle cx={12} cy={13} r={3.5} {...stroke(color)} />
    </Svg>
  );
}

export function AlbumIcon({ size = 20, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={4} width={18} height={16} rx={3} {...stroke(color)} />
      <Circle cx={9} cy={10} r={2} {...stroke(color)} />
      <Path d="M21 16l-5-5-9 9" {...stroke(color)} />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke(color)} strokeWidth={2.6} />
    </Svg>
  );
}

export function CloseIcon({ size = 14, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" {...stroke(color)} strokeWidth={2.6} />
    </Svg>
  );
}

export function EyeIcon({ size = 22, color = colors.inkSub, filled: off }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...stroke(color)} />
      <Circle cx={12} cy={12} r={3} {...stroke(color)} />
      {off && <Path d="M4 4l16 16" {...stroke(color)} />}
    </Svg>
  );
}

export function AlertIcon({ size = 18, color = '#C0353A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path d="M12 7v6M12 16.5v.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
