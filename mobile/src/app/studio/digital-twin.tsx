import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GenerationPreview } from '@/components/studio/GenerationPreview';

export default function DigitalTwinScreen() {
  const { colors } = useTheme();
  const { generate, currentGeneration, loading, error, progress } = useAiGeneration();
  const [images, setImages] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!consent) return;
    await generate('digital_twin', {
      images,
      consent,
    });
  };

  return (
    <SafeAreaWrapper>
      <Header title="Digital Twin" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Create your digital twin for virtual casting and AI scene generation. Upload 5-10 clear photos of your face from different angles.
        </Text>

        {/* Image Upload */}
        <View style={styles.imageSection}>
          <Button
            title="Add Photos"
            onPress={pickImages}
            variant="secondary"
            size="sm"
          />
          
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.imageText, { color: colors.textMuted }]}>
                    Photo {index + 1}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeText}>\u00D7</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Consent */}
        <TouchableOpacity
          style={styles.consentContainer}
          onPress={() => setConsent(!consent)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: consent ? colors.primary : 'transparent',
                borderColor: consent ? colors.primary : colors.border,
              },
            ]}
          >
            {consent && <Text style={styles.checkmark}>\u2713</Text>}
          </View>
          <Text style={[styles.consentText, { color: colors.textMuted }]}>
            I consent to the creation and use of my digital twin for AI-generated content. I understand this will be used per the Terms of Service and Privacy Policy.
          </Text>
        </TouchableOpacity>

        <View style={styles.costRow}>
          <Text style={[styles.costLabel, { color: colors.textMuted }]}>
            Cost:
          </Text>
          <Text style={[styles.costValue, { color: colors.primary }]}>
            10 credits
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
            title={loading ? 'Creating...' : 'Create Digital Twin'}
            onPress={handleGenerate}
            loading={loading}
            disabled={images.length < 3 || !consent || loading}
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
  imageSection: {
    marginBottom: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    fontSize: 11,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  consentText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
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
