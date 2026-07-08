import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ApplicationFormProps {
  onSubmit: (data: { message: string; portfolioUrl?: string }) => void;
  loading?: boolean;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, loading = false }) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const handleSubmit = () => {
    onSubmit({ message, portfolioUrl: portfolioUrl || undefined });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        Cover Letter / Message
      </Text>
      <Input
        value={message}
        onChangeText={setMessage}
        placeholder="Tell us why you're perfect for this role..."
        multiline
        numberOfLines={6}
        inputStyle={{ height: 120 }}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>
        Portfolio Link (optional)
      </Text>
      <Input
        value={portfolioUrl}
        onChangeText={setPortfolioUrl}
        placeholder="https://your-portfolio.com"
        keyboardType="default"
      />

      <Button
        title="Submit Application"
        onPress={handleSubmit}
        loading={loading}
        disabled={!message.trim() || loading}
        size="lg"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
});
