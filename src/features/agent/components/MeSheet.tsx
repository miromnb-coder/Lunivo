import { StyleSheet, Text, View } from 'react-native';

export function MeSheet() {
  return (
    <View style={styles.container}>
      <Text>Me</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});