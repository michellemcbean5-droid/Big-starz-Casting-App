import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GenerationPreview } from '@/components/studio/GenerationPreview';

export default function MusicVideoScreen() {
  const { colors } = useTheme();
  const { generate, currentGeneration, loading, error, progress } = useAiGeneration();
  const [songUrl, setSongUrl] = useState('');
  const [visuals, setVisuals] = useState('');
  const [style, setStyle] = useState('');

  const handleGenerate = async () => {
    await generate('music_video', {
      songUrl,
      visuals,
      style: style || undefined,
    });
  };

  return (
    <SafeAreaWrapper>
      <Header title="Music Video Generator" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Generate stunning AI music videos from your songs and visual prompts.
        </Text>

        <Input
          label="Song URL *"
          value={songUrl}
          onChangeText={setSongUrl}
          placeholder="https://your-song.mp3"
          keyboardType="default"
        />

        <Input
          label="Visual Description *"
          value={visuals}
          onChangeText={setVisuals}
          placeholder="Neon cityscape at night, fast cuts, cinematic lighting..."
          multiline
          numberOfLines={4}
          inputStyle={{ height: 100 }}
        />

        <Input
          label="Style (optional)"
          value={style}
          onChangeText={setStyle}
          placeholder="Vaporwave, minimalist, narrative..."
        />

        <View style={styles.costRow}>
          <Text style={[styles.costLabel, { color: colors.textMuted }]}>
            Cost:
          </Text>
          <Text style={[styles.costValue, { color: colors.primary }]}>
            5 credits
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
            title={loading ? 'Generating...' : 'Generate Music Video'}
            onPress={handleGenerate}
            loading={loading}
            disabled={!songUrl.trim() || !visuals.trim() || loading}
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
