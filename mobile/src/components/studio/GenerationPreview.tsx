import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface GenerationPreviewProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
}

export const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  status,
  progress,
  resultUrl,
}) => {
  const { colors } = useTheme();

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Queued...';
      case 'processing': return `Generating... ${progress}%`;
      case 'completed': return 'Complete!';
      case 'failed': return 'Generation failed';
      default: return 'Unknown';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {getStatusText()}
      </Text>
      
      <View style={[styles.progressBar, { backgroundColor: colors.surfaceDark }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: status === 'failed' ? colors.error : colors.primary,
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      {status === 'completed' && resultUrl && (
        <Text style={[styles.result, { color: colors.success }]}>
          Your content is ready!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  result: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
});
