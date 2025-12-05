import { useState, useEffect } from 'react';

// Define types locally to avoid importing from backend
export interface Briefing {
  id: string;
  userId: string;
  date: string;
  metadata: any; // Simplified for frontend
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stories?: Story[];
}

export interface Story {
  id: string;
  briefingId: string;
  title: string;
  summary: string[];
  content: string[];
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  coverImageUrl: string | null;
  displayOrder: number;
  category: string | null;
  importance: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UseBriefingResult {
  briefing: Briefing | null;
  loading: boolean;
  error: string | null;
}

export default function useBriefing(userId: string | null): UseBriefingResult {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchBriefing = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toLocaleDateString('en-CA');
        const response = await fetch(`http://localhost:3005/api/briefings/date/${today}`, {
          headers: {
            'x-user-id': userId,
          },
        });

        if (response.status === 404) {
          setBriefing(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch briefing: ${response.statusText}`);
        }

        const data = await response.json();
        setBriefing(data.briefing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setBriefing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [userId]);

  return { briefing, loading, error };
}
