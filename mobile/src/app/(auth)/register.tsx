import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Logo } from '@/components/common/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { USER_ROLES } from '@/utils/constants';
import { validateRegistration } from '@/utils/validators';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'talent' | 'casting_director' | 'creator'>('talent');
  const [masterCode, setMasterCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleRegister = async () => {
    setErrors({});
    setGeneralError('');

    const validation = validateRegistration({
      email,
      password,
      confirmPassword,
      role,
      masterCode: masterCode.toUpperCase(),
      acceptTerms,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await register({
        email,
        password,
        confirmPassword,
        role,
        masterCode: masterCode.toUpperCase(),
        acceptTerms,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setGeneralError(err.message || 'Registration failed');
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Creating your account..." />;
  }

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Logo size="md" />

          <View style={styles.form}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Join the Big Starz casting community
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              I am a...
            </Text>
            <View style={styles.roleContainer}>
              {USER_ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor: role === r.value ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color: role === r.value ? colors.textInverse : colors.text,
                      },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.role && (
              <Text style={[styles.fieldError, { color: colors.error }]}>{errors.role}</Text>
            )}

            <Input
              label="Master Access Code"
              value={masterCode}
              onChangeText={setMasterCode}
              placeholder="Enter your code"
              autoCapitalize="characters"
              error={errors.masterCode}
            />

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: acceptTerms ? colors.primary : 'transparent',
                    borderColor: acceptTerms ? colors.primary : colors.border,
                  },
                ]}
              >
                {acceptTerms && <Text style={styles.checkmark}>\u2713</Text>}
              </View>
              <Text style={[styles.termsText, { color: colors.textMuted }]}>
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>
            {errors.acceptTerms && (
              <Text style={[styles.fieldError, { color: colors.error }]}>{errors.acceptTerms}</Text>
            )}

            {generalError ? (
              <Text style={[styles.error, { color: colors.error }]}>{generalError}</Text>
            ) : null}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
            />

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textMuted }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {' '}Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  form: {
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    flex: 1,
  },
  fieldError: {
    fontSize: 12,
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
