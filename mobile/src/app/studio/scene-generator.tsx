import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GenerationPreview } from '@/components/studio/GenerationPreview';

export default function SceneGeneratorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { generate, currentGeneration, loading, error, progress } = useAiGeneration();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [duration, setDuration] = useState('30');

  const handleGenerate = async () => {
    await generate('scene', {
      prompt,
      style: style || undefined,
      duration: parseInt(duration) || 30,
    });
  };

  return (
    <SafeAreaWrapper>
      <Header title="Scene Generator" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Create AI-powered acting scenes with custom prompts. Describe the scene, characters, and mood.
        </Text>

        <Input
          label="Scene Prompt *"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="A dramatic confrontation in a rain-soaked alley..."
          multiline
          numberOfLines={4}
          inputStyle={{ height: 100 }}
        />

        <Input
          label="Style (optional)"
          value={style}
          onChangeText={setStyle}
          placeholder="Film noir, naturalistic, theatrical..."
        />

        <Input
          label="Duration (seconds)"
          value={duration}
          onChangeText={setDuration}
          placeholder="30"
          keyboardType="numeric"
        />

        <View style={styles.costRow}>
          <Text style={[styles.costLabel, { color: colors.textMuted }]}>
            Cost:
          </Text>
          <Text style={[styles.costValue, { color: colors.primary }]}>
            1 credit
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
            title={loading ? 'Generating...' : 'Generate Scene'}
            onPress={handleGenerate}
            loading={loading}
            disabled={!prompt.trim() || loading}
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
