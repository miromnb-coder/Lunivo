import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function ChatInputBar() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputBar}>
        <View style={styles.plusButton}>
          <Feather name="plus" size={35} color="#3b3e48" />
        </View>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.placeholder}>
          Ask anything about your studies
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
  },
  inputBar: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    paddingLeft: 14,
    paddingRight: 24,
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  plusButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    borderWidth: 1,
    borderColor: '#f0f0f2',
  },
  placeholder: {
    flex: 1,
    marginLeft: 22,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '500',
    color: '#a6a7af',
  },
});
