import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/helpers';

const mockEarnings = {
  total: 15000,
  monthly: [
    { month: 'Jan', amount: 2000 },
    { month: 'Feb', amount: 3500 },
    { month: 'Mar', amount: 4500 },
    { month: 'Apr', amount: 2500 },
    { month: 'May', amount: 1500 },
    { month: 'Jun', amount: 1000 },
  ],
  payouts: [
    { id: '1', date: '2025-06-15', amount: 1500, status: 'paid' as const },
    { id: '2', date: '2025-05-20', amount: 2500, status: 'paid' as const },
    { id: '3', date: '2025-04-18', amount: 4500, status: 'paid' as const },
  ],
  breakdown: [
    { source: 'Casting Jobs', amount: 9000 },
    { source: 'AI Content Sales', amount: 3000 },
    { source: 'Digital Twin Licensing', amount: 2000 },
    { source: 'Referrals', amount: 1000 },
  ],
};

export default function EarningsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const maxMonthly = Math.max(...mockEarnings.monthly.map((m) => m.amount));

  return (
    <SafeAreaWrapper>
      <Header title="Earnings" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Card */}
        <Card style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
            Total Earnings
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(mockEarnings.total)}
          </Text>
          <Button
            title="Withdraw"
            onPress={() => {}}
            variant="outline"
            size="sm"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          />
        </Card>

        {/* Monthly Chart */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Monthly Earnings
        </Text>
        <Card style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {mockEarnings.monthly.map((item) => (
              <View key={item.month} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(item.amount / maxMonthly) * 100}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                  {item.month}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Revenue Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Revenue Breakdown
        </Text>
        {mockEarnings.breakdown.map((item) => (
          <View key={item.source} style={styles.breakdownRow}>
            <Text style={[styles.breakdownSource, { color: colors.text }]}>
              {item.source}
            </Text>
            <Text style={[styles.breakdownAmount, { color: colors.primary }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}

        {/* Payout History */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payout History
        </Text>
        {mockEarnings.payouts.map((payout) => (
          <Card key={payout.id} style={styles.payoutCard} padding="sm">
            <View style={styles.payoutRow}>
              <View>
                <Text style={[styles.payoutDate, { color: colors.textMuted }]}>
                  {payout.date}
                </Text>
                <Text style={[styles.payoutStatus, { color: colors.success }]}>
                  {payout.status.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.payoutAmount, { color: colors.text }]}>
                {formatCurrency(payout.amount)}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  totalCard: {
    marginTop: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  chartCard: {
    marginBottom: 20,
    paddingVertical: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3F',
  },
  breakdownSource: {
    fontSize: 14,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  payoutCard: {
    marginBottom: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  payoutStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
