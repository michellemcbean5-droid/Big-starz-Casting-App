import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { AIToolCard } from '@/components/studio/AIToolCard';
import { CreditDisplay } from '@/components/studio/CreditDisplay';
import { Card } from '@/components/ui/Card';
import { AI_GENERATION_COSTS } from '@/utils/constants';

const aiTools = [
  {
    title: 'Scene Generator',
    description: 'Create AI-powered acting scenes with custom prompts and styles.',
    icon: '\u25B6',
    toolType: 'scene-generator' as const,
    creditCost: AI_GENERATION_COSTS.scene,
  },
  {
    title: 'Reel Generator',
    description: 'Compile your best clips into a professional demo reel with AI editing.',
    icon: '\u25CF',
    toolType: 'reel-generator' as const,
    creditCost: AI_GENERATION_COSTS.reel,
  },
  {
    title: 'Music Video',
    description: 'Generate stunning AI music videos from your songs and visual prompts.',
    icon: '\u266B',
    toolType: 'music-video' as const,
    creditCost: AI_GENERATION_COSTS.music_video,
  },
  {
    title: 'Digital Twin',
    description: 'Create your digital twin for virtual casting and AI scene generation.',
    icon: '\u25C9',
    toolType: 'digital-twin' as const,
    creditCost: AI_GENERATION_COSTS.digital_twin,
  },
];

const recentGenerations = [
  { id: '1', title: 'Drama Scene #4', type: 'scene', createdAt: '2025-03-01' },
  { id: '2', title: 'Demo Reel 2025', type: 'reel', createdAt: '2025-02-28' },
  { id: '3', title: 'Pop Music Visual', type: 'music_video', createdAt: '2025-02-20' },
];

export default function StudioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const credits = 25;
  const tier = user?.subscription?.tier || 'bronze';

  return (
    <SafeAreaWrapper>
      <Header title="AI Studio" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <CreditDisplay credits={credits} tier={tier} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          AI Tools
        </Text>

        {aiTools.map((tool) => (
          <AIToolCard key={tool.toolType} {...tool} />
        ))}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>
          Recent Generations
        </Text>

        {recentGenerations.map((gen) => (
          <Card key={gen.id} style={styles.genCard} padding="sm">
            <View style={styles.genRow}>
              <Text style={[styles.genIcon, { color: colors.primary }]}>
                {gen.type === 'scene' ? '\u25B6' : gen.type === 'reel' ? '\u25CF' : '\u266B'}
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
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
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
