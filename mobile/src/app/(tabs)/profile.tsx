import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const menuItems = [
  { label: 'Edit Profile', route: '/profile/edit', icon: '\u270E' },
  { label: 'Settings', route: '/profile/settings', icon: '\u2699' },
  { label: 'My Contracts', route: '/profile/contracts', icon: '\u25A0' },
  { label: 'Help & Support', route: '/profile/help', icon: '?' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const userName = user?.profile?.stageName || user?.email?.split('@')[0] || 'User';
  const role = user?.role || 'talent';
  const tier = user?.subscription?.tier || 'free';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaWrapper>
      <Header title="Profile" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
          <Avatar name={userName} size={80} />
          <Text style={[styles.userName, { color: colors.text }]}>
            {userName}
          </Text>
          <View style={styles.badgesRow}>
            <Badge text={role.replace('_', ' ')} variant="primary" />
            <Badge text={tier.toUpperCase()} variant="warning" />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuIcon, { color: colors.primary }]}>
                  {item.icon}
                </Text>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                {'>'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="lg"
          />
        </View>

        {/* App Info */}
        <Text style={[styles.appInfo, { color: colors.textMuted }]}>
          Big Starz Casting v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    width: 28,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 18,
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  appInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
});
