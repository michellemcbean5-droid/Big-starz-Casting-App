import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaWrapper } from '@/components/layout/SafeAreaWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { CastingCard } from '@/components/casting/CastingCard';
import { CastingFilter } from '@/components/casting/CastingFilter';
import { useCastingCalls } from '@/hooks/useCastingCalls';

const mockCastingCalls: any[] = [
  {
    id: '1',
    title: 'Lead Role - Sci-Fi Feature Film',
    description: 'Seeking a charismatic lead for an upcoming sci-fi blockbuster.',
    type: 'film',
    location: 'Los Angeles, CA',
    budget: '$50,000 - $100,000',
    deadline: '2025-12-31',
    status: 'open',
    requirements: ['Age 25-35'],
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    title: 'Supporting Role - Netflix Series',
    description: 'Recurring supporting role in a new Netflix drama series.',
    type: 'tv',
    location: 'New York, NY',
    budget: '$15,000 - $25,000',
    deadline: '2025-11-15',
    status: 'open',
    requirements: ['Age 20-30'],
    createdAt: '2025-01-15',
  },
  {
    id: '3',
    title: 'Commercial - Luxury Brand',
    description: 'High-end luxury brand commercial seeking elegant talent.',
    type: 'commercial',
    location: 'Miami, FL',
    budget: '$5,000 - $10,000',
    deadline: '2025-10-30',
    status: 'open',
    requirements: ['Age 25-45'],
    createdAt: '2025-02-01',
  },
  {
    id: '4',
    title: 'Music Video - Pop Artist',
    description: 'Lead dancer role for major pop artist music video.',
    type: 'music_video',
    location: 'Atlanta, GA',
    budget: '$2,000 - $5,000',
    deadline: '2025-09-20',
    status: 'open',
    requirements: ['Dance experience'],
    createdAt: '2025-02-15',
  },
  {
    id: '5',
    title: 'Theater - Broadway Revival',
    description: 'Ensemble role in classic Broadway revival.',
    type: 'theater',
    location: 'New York, NY',
    budget: '$1,500/wk',
    deadline: '2025-08-15',
    status: 'open',
    requirements: ['Singing ability', 'Dance experience'],
    createdAt: '2025-03-01',
  },
];

export default function CastingScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { loading, refreshing, refresh, loadMore, hasMore } = useCastingCalls();

  const filteredCasting = mockCastingCalls.filter((c) => {
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaWrapper>
      <Header title="Casting Calls" />
      <View style={styles.container}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search casting calls..."
          style={{ marginBottom: 8 }}
        />

        <CastingFilter
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />

        {loading && !refreshing ? (
          <Loading message="Loading casting calls..." />
        ) : filteredCasting.length === 0 ? (
          <EmptyState
            title="No casting calls found"
            message="Try adjusting your search or filters"
            actionLabel="Clear Filters"
            onAction={() => { setSearchQuery(''); setSelectedType(null); }}
          />
        ) : (
          <FlatList
            data={filteredCasting}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CastingCard casting={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore && !refreshing ? (
                <Loading message="Loading more..." />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
});
