import { StyleSheet, Text, View } from 'react-native';

import { agentTheme } from '../constants/agentTheme';

export function ChatInputBar() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputBar}>
        <View style={styles.plusButton}>
          <Text style={styles.plus}>+</Text>
        </View>
        <Text style={styles.placeholder}>Ask anything about your studies</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 34,
  },
  inputBar: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    paddingLeft: 18,
    paddingRight: 28,
    shadowColor: agentTheme.colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  plusButton: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: agentTheme.colors.surface,
    borderWidth: 1,
    borderColor: '#f0f0f2',
  },
  plus: {
    marginTop: -2,
    fontSize: 47,
    lineHeight: 52,
    fontWeight: '300',
    color: '#3b3e48',
  },
  placeholder: {
    flex: 1,
    marginLeft: 26,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    color: '#a6a7af',
  },
});
