import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
    import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ApplicationForm } from '@/components/casting/ApplicationForm';

export default function ApplyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please include a cover letter or message');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Application Submitted',
        'Your application has been submitted successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <Header title="Apply" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Tell us why you're the perfect fit for this role. Include a video introduction to stand out.
        </Text>

        <Input
          label="Cover Letter / Message *"
          value={message}
          onChangeText={setMessage}
          placeholder="Introduce yourself and explain why you're perfect for this role..."
          multiline
          numberOfLines={6}
          inputStyle={{ height: 140 }}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>
          Video Introduction
        </Text>
        <View style={styles.videoButtons}>
          <Button
            title="Upload Video"
            onPress={pickVideo}
            variant="secondary"
            size="sm"
          />
          <Button
            title="Record Video"
            onPress={recordVideo}
            variant="outline"
            size="sm"
          />
        </View>
        {videoUri && (
          <Card style={styles.videoPreview} padding="sm">
            <Text style={[styles.videoText, { color: colors.success }]}>
              {'\u2713'} Video selected
            </Text>
          </Card>
        )}

        <Input
          label="Portfolio Link (optional)"
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
          placeholder="https://your-portfolio.com"
          keyboardType="default"
        />

        <View style={styles.submitSection}>
          <Button
            title="Submit Application"
            onPress={handleSubmit}
            loading={loading}
            disabled={!message.trim() || loading}
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  videoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  videoPreview: {
    marginBottom: 16,
  },
  videoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitSection: {
    paddingVertical: 24,
  },
});
