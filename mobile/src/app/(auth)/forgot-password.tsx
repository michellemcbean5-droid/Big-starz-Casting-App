import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <Header title="Reset Password" showBack />
      <View style={styles.container}>
        {submitted ? (
          <View style={styles.successContainer}>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Check your email
            </Text>
            <Text style={[styles.successText, { color: colors.textMuted }]}>
              If an account exists with {email}, we have sent password reset instructions.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => router.push('/(auth)/login')}
              variant="outline"
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {error ? (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            ) : null}

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
            />
          </>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  description: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
