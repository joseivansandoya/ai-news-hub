import { useState, useEffect } from 'react';

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

// Internal interface to match the API response shape (snake_case)
interface StoryApiResponse {
  id: string;
  briefing_id: string;
  title: string;
  summary: string[];
  content: string[];
  source_url: string;
  source_name: string;
  published_at: string;
  cover_image_url: string | null;
  display_order: number;
  category: string | null;
  importance: number | null;
  created_at: string;
  updated_at: string;
}

interface UseStoryResult {
  story: Story | null;
  loading: boolean;
  error: string | null;
}

export default function useStory(storyId: string | null, userId: string | null): UseStoryResult {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storyId || !userId) {
      return;
    }

    const fetchStory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:3005/api/stories/${storyId}`, {
          headers: {
            'x-user-id': userId,
          },
        });

        if (response.status === 404) {
          setStory(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch story: ${response.statusText}`);
        }

        const data: StoryApiResponse = await response.json();

        // Map snake_case API response to camelCase Story interface
        const mappedStory: Story = {
          id: data.id,
          briefingId: data.briefing_id,
          title: data.title,
          summary: data.summary,
          content: data.content,
          sourceUrl: data.source_url,
          sourceName: data.source_name,
          publishedAt: new Date(data.published_at),
          coverImageUrl: data.cover_image_url,
          displayOrder: data.display_order,
          category: data.category,
          importance: data.importance,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        setStory(mappedStory);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, userId]);

  return { story, loading, error };
}
