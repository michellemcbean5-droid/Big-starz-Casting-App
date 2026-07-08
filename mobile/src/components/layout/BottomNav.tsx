import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { usePathname, useRouter } from 'expo-router';

const tabs = [
  { name: 'Home', path: '/', icon: '\u2302' },
  { name: 'Casting', path: '/casting', icon: '\u2315' },
  { name: 'Studio', path: '/studio', icon: '\u2726' },
  { name: 'Earnings', path: '/earnings', icon: '$' },
  { name: 'Profile', path: '/profile', icon: '\u263A' },
];

export const BottomNav: React.FC = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.push(tab.path)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.icon,
                { color: active ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                { color: active ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
