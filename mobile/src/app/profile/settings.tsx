import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();

  const renderToggle = (item: any, index: number, total: number) => (
    <View
      key={item.label}
      style={[
        styles.settingRow,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: index < total - 1 ? 1 : 0,
        },
      ]}
    >
      <Text style={[styles.settingLabel, { color: colors.text }]}>
        {item.label}
      </Text>
      <Switch
        value={item.value}
        onValueChange={item.onToggle || (() => {})}
        trackColor={{ false: colors.surfaceDark, true: colors.primary + '80' }}
        thumbColor={item.value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <SafeAreaWrapper>
      <Header title="Settings" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Appearance
          </Text>
          <Card padding="none">
            {renderToggle(
              { label: 'Dark Mode', value: theme === 'dark', onToggle: toggleTheme },
              0,
              1
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Notifications
          </Text>
          <Card padding="none">
            {[
              { label: 'Casting Alerts', value: true },
              { label: 'Application Updates', value: true },
              { label: 'AI Generation Complete', value: true },
              { label: 'Earnings & Payouts', value: true },
            ].map((item, index, arr) => renderToggle(item, index, arr.length))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Privacy
          </Text>
          <Card padding="none">
            {[
              { label: 'Public Profile', value: false },
              { label: 'Show Earnings', value: false },
            ].map((item, index, arr) => renderToggle(item, index, arr.length))}
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            Big Starz Casting v1.0.0
          </Text>
          <TouchableOpacity>
            <Text style={[styles.link, { color: colors.primary }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.link, { color: colors.primary }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLabel: {
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  version: {
    fontSize: 13,
    marginBottom: 16,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
});
