import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
