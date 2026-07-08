import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();

  const [stageName, setStageName] = useState(user?.profile?.stageName || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [skills, setSkills] = useState(user?.profile?.skills?.join(', ') || '');
  const [ageRange, setAgeRange] = useState(user?.profile?.ageRange || '');
  const [unionStatus, setUnionStatus] = useState(user?.profile?.unionStatus || '');
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Handle avatar upload
      Alert.alert('Avatar selected', 'Avatar upload functionality will be implemented with backend integration.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.profile?.stageName || user?.email?.split('@')[0] || 'User';

  return (
    <SafeAreaWrapper>
      <Header title="Edit Profile" showBack />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar name={userName} size={100} />
          <TouchableOpacity onPress={pickAvatar} style={{ marginTop: 12 }}>
            <Text style={[styles.changePhoto, { color: colors.primary }]}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Stage Name"
          value={stageName}
          onChangeText={setStageName}
          placeholder="Your professional name"
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell casting directors about yourself..."
          multiline
          numberOfLines={4}
          inputStyle={{ height: 100 }}
        />

        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="City, State"
        />

        <Input
          label="Skills (comma-separated)"
          value={skills}
          onChangeText={setSkills}
          placeholder="Acting, Dancing, Singing, Martial Arts..."
        />

        <Input
          label="Age Range"
          value={ageRange}
          onChangeText={setAgeRange}
          placeholder="e.g., 25-35"
        />

        <Input
          label="Union Status"
          value={unionStatus}
          onChangeText={setUnionStatus}
          placeholder="SAG-AFTRA, Equity, Non-Union..."
        />

        <View style={styles.buttonSection}>
          <Button
            title="Save Profile"
            onPress={handleSave}
            loading={loading}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  changePhoto: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSection: {
    paddingVertical: 24,
  },
});
