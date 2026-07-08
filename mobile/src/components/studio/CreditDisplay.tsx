import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';

interface CreditDisplayProps {
  credits: number;
  tier: string;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ credits, tier }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.container}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Available Credits
          </Text>
          <Text style={[styles.credits, { color: colors.primary }]}>
            {credits}
          </Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.tierText, { color: colors.primary }]}>
            {tier.toUpperCase()}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  credits: {
    fontSize: 28,
    fontWeight: '800',
  },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
