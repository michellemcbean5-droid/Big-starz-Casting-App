import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { APP_NAME } from '@/utils/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const { colors } = useTheme();

  const getSizes = () => {
    switch (size) {
      case 'sm': return { container: 36, icon: 20, text: 16 };
      case 'md': return { container: 56, icon: 32, text: 24 };
      case 'lg': return { container: 80, icon: 48, text: 36 };
      default: return { container: 56, icon: 32, text: 24 };
    }
  };

  const sizes = getSizes();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: sizes.container,
            height: sizes.container,
            borderRadius: sizes.container / 2,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: sizes.icon, color: colors.textInverse }]}>
          \u2605
        </Text>
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: sizes.text, color: colors.text }]}>
          {APP_NAME}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontWeight: '700',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});
