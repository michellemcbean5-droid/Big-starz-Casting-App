import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CASTING_TYPES } from '@/utils/constants';

interface CastingFilterProps {
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

export const CastingFilter: React.FC<CastingFilterProps> = ({ selectedType, onSelectType }) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: selectedType === null ? colors.primary : colors.surface,
          },
        ]}
        onPress={() => onSelectType(null)}
      >
        <Text
          style={[
            styles.chipText,
            { color: selectedType === null ? colors.textInverse : colors.text },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {CASTING_TYPES.map((type) => {
        const isSelected = selectedType === type.value;
        return (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => onSelectType(isSelected ? null : type.value)}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? colors.textInverse : colors.text },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
