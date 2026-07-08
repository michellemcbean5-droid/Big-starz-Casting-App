import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { CastingCall } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/helpers';

interface CastingCardProps {
  casting: CastingCall;
}

export const CastingCard: React.FC<CastingCardProps> = ({ casting }) => {
  const { colors } = useTheme();
  const router = useRouter();

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'film': return 'primary' as const;
      case 'tv': return 'success' as const;
      case 'commercial': return 'warning' as const;
      default: return 'default' as const;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/casting/${casting.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Badge text={casting.type.replace('_', ' ').toUpperCase()} variant={getTypeVariant(casting.type)} />
        <Text style={[styles.deadline, { color: colors.textMuted }]}>
          {formatDate(casting.deadline)}
        </Text>
      </View>
      
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {casting.title}
      </Text>
      
      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
        {casting.description}
      </Text>
      
      <View style={styles.footer}>
        <Text style={[styles.location, { color: colors.textMuted }]}>
          {casting.location}
        </Text>
        {casting.budget && (
          <Text style={[styles.budget, { color: colors.primary }]}>
            {casting.budget}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deadline: {
    fontSize: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
  },
  budget: {
    fontSize: 14,
    fontWeight: '600',
  },
});
