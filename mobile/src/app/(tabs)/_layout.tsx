import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Text } from 'react-native';

function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: any }) {
  return (
    <Text style={{ fontSize: 22, color, fontWeight: focused ? '700' : '400' }}>
      {icon}
    </Text>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="\u2302" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="casting"
        options={{
          title: 'Casting',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="\u2315" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="\u2726" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="$" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="\u263A" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
