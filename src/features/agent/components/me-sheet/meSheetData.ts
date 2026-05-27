import { Platform } from 'react-native';

import { agentTheme } from '../../constants/agentTheme';

export const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
export const AVATAR_COLOR = '#b1a29b';
export const ICON_COLOR = agentTheme.colors.text;
export const SHEET_BACKGROUND = '#fffefc';
export const CARD_BACKGROUND = 'rgba(255,255,255,0.54)';
export const BORDER_COLOR = 'rgba(31,36,48,0.055)';
export const DIVIDER_COLOR = 'rgba(31,36,48,0.065)';

export const CURRENT_CREDITS = 263;
export const DAILY_REFRESH_CREDITS = 150;

export const CLOSE_DISTANCE = 88;
export const CLOSE_VELOCITY = 0.85;
export const DRAG_ACTIVATION_DISTANCE = 7;
export const HIDDEN_SHEET_HEIGHT_RATIO = 0.86;
export const HIDDEN_SHEET_EXTRA_OFFSET = 90;

export const OPEN_SPRING_CONFIG = {
  damping: 25,
  stiffness: 230,
  mass: 0.9,
  overshootClamping: true,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
  useNativeDriver: true,
} as const;

export const CREDIT_HISTORY = [
  { date: '19 May 2026', title: 'What AI model do you use', value: '-22' },
  { date: '13 May 2026', title: 'Personal StudyPilot assistant', value: '-9' },
  { date: '11 May 2026', title: 'Optimize a personal AI agent', value: '-64' },
  { date: '2 May 2026', title: 'Plan my day', value: '-20' },
];
