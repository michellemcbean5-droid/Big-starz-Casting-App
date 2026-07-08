import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/utils/helpers';

const mockCastingDetail = {
  id: '1',
  title: 'Lead Role - Sci-Fi Feature Film',
  description: 'We are seeking a charismatic and versatile lead actor for our upcoming sci-fi feature film "Nebula Protocol." The film is a character-driven space opera with intense emotional beats and action sequences.\n\nThe ideal candidate should have strong dramatic chops, be comfortable with physical stunts, and have experience working with green screen.',
  type: 'film',
  location: 'Los Angeles, CA',
  budget: '$50,000 - $100,000',
  deadline: '2025-12-31',
  status: 'open',
  requirements: [
    'Age 25-35',
    'Prior lead or supporting role in feature film',
    'Comfortable with action/stunt work',
    'Union eligible (SAG-AFTRA)',
    'Available for 3-month shoot',
  ],
  director: {
    name: 'Sarah Chen',
    bio: 'Award-winning director known for visually stunning sci-fi films.',
  },
  roles: [
    {
      name: 'Commander Alex Vance',
      description: 'The protagonist. A former pilot turned resistance leader.',
      compensation: '$75,000',
    },
  ],
  createdAt: '2025-01-01',
};

export default function CastingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [casting] = useState(mockCastingDetail);

  const handleApply = () => {
    router.push(`/casting/apply?id=${id}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this casting call: ${casting.title} on Big Starz Casting!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaWrapper>
      <Header
        title="Casting Details"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleShare}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>\u21B1</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Badge text={casting.type.toUpperCase()} variant="primary" />
          <Text style={[styles.deadline, { color: colors.textMuted }]}>
            Deadline: {formatDate(casting.deadline)}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {casting.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {casting.location}
          </Text>
          <Text style={[styles.budget, { color: colors.primary }]}>
            {casting.budget}
          </Text>
        </View>

        {/* Director Profile */}
        <Card style={styles.directorCard}>
          <View style={styles.directorRow}>
            <Avatar name={casting.director.name} size={48} />
            <View style={styles.directorInfo}>
              <Text style={[styles.directorName, { color: colors.text }]}>
                {casting.director.name}
              </Text>
              <Text style={[styles.directorBio, { color: colors.textMuted }]}>
                {casting.director.bio}
              </Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          About the Project
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {casting.description}
        </Text>

        {/* Role Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Role Breakdown
        </Text>
        {casting.roles.map((role, index) => (
          <Card key={index} style={styles.roleCard}>
            <Text style={[styles.roleName, { color: colors.text }]}>
              {role.name}
            </Text>
            <Text style={[styles.roleDesc, { color: colors.textMuted }]}>
              {role.description}
            </Text>
            <Text style={[styles.roleComp, { color: colors.primary }]}>
              {role.compensation}
            </Text>
          </Card>
        ))}

        {/* Requirements */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Requirements
        </Text>
        <Card style={styles.requirementsCard}>
          {casting.requirements.map((req, index) => (
            <View key={index} style={styles.reqRow}>
              <Text style={[styles.reqBullet, { color: colors.primary }]}>
                \u2713
              </Text>
              <Text style={[styles.reqText, { color: colors.text }]}>
                {req}
              </Text>
            </View>
          ))}
        </Card>

        {/* Apply Button */}
        <View style={styles.applySection}>
          <Button
            title="Apply Now"
            onPress={handleApply}
            size="lg"
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  deadline: {
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
  },
  budget: {
    fontSize: 16,
    fontWeight: '700',
  },
  directorCard: {
    marginBottom: 20,
  },
  directorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  directorName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  directorBio: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  roleCard: {
    marginBottom: 10,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  roleComp: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsCard: {
    marginBottom: 20,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  reqBullet: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '700',
  },
  reqText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  applySection: {
    paddingVertical: 24,
  },
});
