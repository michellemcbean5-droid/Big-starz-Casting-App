import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Loading } from '@/components/ui/Loading';
import { CastingCard } from '@/components/casting/CastingCard';

const mockFeaturedCasting: any[] = [
  {
    id: '1',
    title: 'Lead Role - Sci-Fi Feature Film',
    description: 'Seeking a charismatic lead for an upcoming sci-fi blockbuster. Must have action experience.',
    type: 'film',
    location: 'Los Angeles, CA',
    budget: '$50,000 - $100,000',
    deadline: '2025-12-31',
    status: 'open',
    requirements: ['Age 25-35', 'Action experience', 'Union eligible'],
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    title: 'Supporting Role - Netflix Series',
    description: 'Recurring supporting role in a new Netflix drama series. 6 episode arc.',
    type: 'tv',
    location: 'New York, NY',
    budget: '$15,000 - $25,000',
    deadline: '2025-11-15',
    status: 'open',
    requirements: ['Age 20-30', 'Drama training', 'Available for 3 months'],
    createdAt: '2025-01-15',
  },
  {
    id: '3',
    title: 'Commercial - Luxury Brand',
    description: 'High-end luxury brand commercial seeking elegant talent.',
    type: 'commercial',
    location: 'Miami, FL',
    budget: '$5,000 - $10,000',
    deadline: '2025-10-30',
    status: 'open',
    requirements: ['Age 25-45', 'Commercial experience'],
    createdAt: '2025-02-01',
  },
];

const mockGenerations = [
  { id: 'g1', type: 'scene', title: 'Drama Scene #4', createdAt: '2025-03-01' },
  { id: 'g2', type: 'reel', title: 'Demo Reel 2025', createdAt: '2025-02-28' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const userName = user?.profile?.stageName || user?.email?.split('@')[0] || 'Talent';

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <View style={[styles.welcomeBanner, { backgroundColor: colors.surface }]}>
          <View style={styles.welcomeContent}>
            <Text style={[styles.welcomeText, { color: colors.textMuted }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
          </View>
          <Avatar name={userName} size={48} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding="sm">
            <Text style={[styles.statValue, { color: colors.primary }]}>25</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Credits</Text>
          </Card>
          <Card style={styles.statCard} padding="sm">
            <Text style={[styles.statValue, { color: colors.primary }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Applications</Text>
          </Card>
          <Card style={styles.statCard} padding="sm">
            <Text style={[styles.statValue, { color: colors.primary }]}>$0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Earnings</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="AI Studio"
            onPress={() => router.push('/(tabs)/studio')}
            variant="secondary"
            size="sm"
          />
          <Button
            title="Browse Casting"
            onPress={() => router.push('/(tabs)/casting')}
            variant="outline"
            size="sm"
          />
        </View>

        {/* Featured Casting */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Casting Calls
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/casting')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {mockFeaturedCasting.map((casting) => (
            <CastingCard key={casting.id} casting={casting} />
          ))}
        </View>

        {/* Recent AI Generations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent AI Generations
          </Text>
          {mockGenerations.map((gen) => (
            <Card key={gen.id} style={styles.genCard} padding="sm">
              <View style={styles.genRow}>
                <Text style={[styles.genIcon, { color: colors.primary }]}>
                  {gen.type === 'scene' ? '\u25B6' : '\u25CF'}
                </Text>
                <View style={styles.genInfo}>
                  <Text style={[styles.genTitle, { color: colors.text }]}>
                    {gen.title}
                  </Text>
                  <Text style={[styles.genType, { color: colors.textMuted }]}>
                    {gen.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
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
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  genCard: {
    marginBottom: 8,
  },
  genRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  genInfo: {
    flex: 1,
  },
  genTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  genType: {
    fontSize: 11,
    marginTop: 2,
  },
});
