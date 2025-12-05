import { useState } from 'react';
import { Briefing, Story } from './useBriefing';

interface GenerateBriefingResponse {
  briefing: Briefing;
  stories: Story[];
}

interface UseGenerateBriefingResult {
  generateBriefing: () => Promise<void>;
  loading: boolean;
  error: string | null;
  data: GenerateBriefingResponse | null;
}

export default function useGenerateBriefing(): UseGenerateBriefingResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateBriefingResponse | null>(null);

  const generateBriefing = async () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.warn('No user ID found in local storage');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3005/api/briefings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate briefing: ${response.statusText}`);
      }

      const result: GenerateBriefingResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { generateBriefing, loading, error, data };
}
