import type { ReactNode } from 'react';
import { View } from 'react-native';

import { styles } from './meSheetStyles';

export function MeSheetCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function MeSheetDivider() {
  return <View style={styles.divider} />;
}
