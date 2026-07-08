import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GenerationPreview } from '@/components/studio/GenerationPreview';

export default function ReelGeneratorScreen() {
  const { colors } = useTheme();
  const { generate, currentGeneration, loading, error, progress } = useAiGeneration();
  const [clips, setClips] = useState('');
  const [style, setStyle] = useState('');
  const [music, setMusic] = useState('');

  const handleGenerate = async () => {
    const clipList = clips.split(',').map((c) => c.trim()).filter(Boolean);
    await generate('reel', {
      clips: clipList,
      style: style || undefined,
      music: music || undefined,
    });
  };

  return (
    <SafeAreaWrapper>
      <Header title="Reel Generator" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Compile your best clips into a professional demo reel with AI editing, transitions, and music.
        </Text>

        <Input
          label="Clip URLs (comma-separated) *"
          value={clips}
          onChangeText={setClips}
          placeholder="https://clip1.mp4, https://clip2.mp4..."
          multiline
          numberOfLines={3}
          inputStyle={{ height: 80 }}
        />

        <Input
          label="Style (optional)"
          value={style}
          onChangeText={setStyle}
          placeholder="Dramatic, upbeat, cinematic..."
        />

        <Input
          label="Music (optional)"
          value={music}
          onChangeText={setMusic}
          placeholder="URL to background music or describe the mood"
        />

        <View style={styles.costRow}>
          <Text style={[styles.costLabel, { color: colors.textMuted }]}>
            Cost:
          </Text>
          <Text style={[styles.costValue, { color: colors.primary }]}>
            3 credits
          </Text>
        </View>

        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}

        {currentGeneration && (
          <GenerationPreview
            status={currentGeneration.status}
            progress={progress}
            resultUrl={currentGeneration.outputUrl}
          />
        )}

        <View style={styles.buttonSection}>
          <Button
            title={loading ? 'Generating...' : 'Generate Reel'}
            onPress={handleGenerate}
            loading={loading}
            disabled={!clips.trim() || loading}
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  costLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonSection: {
    paddingVertical: 24,
  },
});
