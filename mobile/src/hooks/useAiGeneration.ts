import { useState, useCallback, useRef } from 'react';
import { aiService } from '@/services/ai';
import { AiGeneration, AiGenerationType } from '@/types';

export function useAiGeneration() {
  const [generations, setGenerations] = useState<AiGeneration[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<AiGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback((id: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await aiService.getGenerationStatus(id);
        if (response.success && response.data) {
          setCurrentGeneration(response.data);
          
          if (response.data.status === 'completed') {
            setProgress(100);
            setLoading(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setGenerations((prev) => [response.data!, ...prev]);
          } else if (response.data.status === 'failed') {
            setLoading(false);
            setError('Generation failed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else {
            setProgress((prev) => Math.min(prev + 10, 90));
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }, []);

  const generate = useCallback(async (
    type: AiGenerationType,
    params: any
  ) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      let response;
      switch (type) {
        case 'scene':
          response = await aiService.generateScene(params);
          break;
        case 'reel':
          response = await aiService.generateReel(params);
          break;
        case 'music_video':
          response = await aiService.generateMusicVideo(params);
          break;
        case 'digital_twin':
          response = await aiService.generateDigitalTwin(params);
          break;
        default:
          throw new Error('Unknown generation type');
      }

      if (response.success && response.data) {
        setCurrentGeneration(response.data);
        setProgress(10);
        pollStatus(response.data.id);
        return response.data;
      } else {
        throw new Error(response.message || 'Generation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
      setLoading(false);
      return null;
    }
  }, [pollStatus]);

  const cancel = useCallback(async () => {
    if (currentGeneration?.id && currentGeneration.status === 'processing') {
      await aiService.cancelGeneration(currentGeneration.id);
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLoading(false);
    setProgress(0);
  }, [currentGeneration]);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await aiService.getMyGenerations();
      if (response.success && response.data) {
        setGenerations(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch generations');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generations,
    currentGeneration,
    loading,
    error,
    progress,
    generate,
    cancel,
    fetchGenerations,
  };
}
