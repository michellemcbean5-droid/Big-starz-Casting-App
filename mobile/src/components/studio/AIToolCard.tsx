import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AI_GENERATION_COSTS } from '@/utils/constants';

interface AIToolCardProps {
  title: string;
  description: string;
  icon: string;
  toolType: 'scene-generator' | 'reel-generator' | 'music-video' | 'digital-twin';
  creditCost: number;
}

export const AIToolCard: React.FC<AIToolCardProps> = ({
  title,
  description,
  icon,
  toolType,
  creditCost,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  const getRoute = () => {
    switch (toolType) {
      case 'scene-generator': return '/studio/scene-generator';
      case 'reel-generator': return '/studio/reel-generator';
      case 'music-video': return '/studio/music-video';
      case 'digital-twin': return '/studio/digital-twin';
      default: return '/studio';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(getRoute())}
      activeOpacity={0.8}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.icon, { color: colors.primary }]}>{icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {description}
            </Text>
          </View>
          <View style={[styles.creditBadge, { backgroundColor: colors.surfaceDark }]}>
            <Text style={[styles.creditText, { color: colors.primary }]}>
              {creditCost} credit{creditCost !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  creditBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  creditText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
