import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import {
  webSearchStoriesPrompt,
  curateAndSummarizeStoriesPrompt,
} from '@/services/prompts/webSearchStories';

export class BriefingsService {
  /**
   * Generate briefing using LLM-orchestrated web search.
   *
   * Workflow:
   * 1. SEARCH PHASE: LLM uses web search tool to find top AI news stories
   * 2. CURATE PHASE: LLM deduplicates, ranks, and summarizes into exactly 6 stories
   */
  async generate() {
    const startTime = Date.now();
    const searchResult = await this.searchForStories();
    const rawStories = this.parseStoriesFromSearchResult(searchResult.text);
    const curationResult = await this.curateAndSummarizeStories(rawStories);

    const totalInputTokens =
      (searchResult.usage?.inputTokens || 0) +
      (curationResult.usage.inputTokens || 0);
    const totalOutputTokens =
      (searchResult.usage?.outputTokens || 0) +
      (curationResult.usage.outputTokens || 0);
    const llmTokensUsed = totalInputTokens + totalOutputTokens;
    const llmCost = this.calculateLLMCost(totalInputTokens, totalOutputTokens);
    const generationTimeMs = Date.now() - startTime;

    return {
      stories: curationResult.object.stories,
      metadata: {
        totalItemsFetched: rawStories.length,
        storiesAfterDedup: curationResult.object.stories.length,
        llmTokensUsed,
        llmCost,
        generationTimeMs,
      },
    };
  }

  private calculateLLMCost(inputTokens: number, outputTokens: number) {
    const inputRate = 2.50 / 1000000;
    const outputRate = 10.00 / 1000000;
    return (inputTokens * inputRate) + (outputTokens * outputRate);
  }

  /**
   * Use LLM with web search tool to find AI news stories.
   */
  private async searchForStories() {
    return generateText({
      model: openai.responses('gpt-4o'),
      prompt: webSearchStoriesPrompt,
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: 'high',
        }),
      },
    });
  }

  /**
   * Parse the LLM's search response into structured story objects.
   * Filters out stories older than 48 hours as a validation layer.
   */
  private parseStoriesFromSearchResult(text: string): WebSearchStory[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          const stories = parsed.map(story => ({
            title: story.title || '',
            content: story.content || story.description || '',
            url: story.url || story.link || '',
            sourceName: story.sourceName || story.source || '',
            publishedAt: story.publishedAt || 'recent',
          }));

          const recentStories = stories.filter(story => this.isStoryRecent(story));

          console.log(`Parsed ${stories.length} stories, ${recentStories.length} are recent (last 48 hours)`);

          return recentStories;
        }
      }
    } catch (e) {
      console.error('Failed to parse search results as JSON:', e);
    }

    return [];
  }

  /**
   * Check if a story is from the last 48 hours.
   */
  private isStoryRecent(story: WebSearchStory): boolean {
    const publishedAt = story.publishedAt.toLowerCase();

    if (publishedAt === 'recent') {
      return true;
    }

    const recentIndicators = [
      'today',
      'yesterday',
      'hours ago',
      'hour ago',
      'minutes ago',
      'just now',
      'this morning',
      'this afternoon',
      'this evening'
    ];

    if (recentIndicators.some(indicator => publishedAt.includes(indicator))) {
      return true;
    }

    try {
      const date = new Date(story.publishedAt);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        if (date >= twoDaysAgo) {
          return true;
        } else {
          console.log(`Filtering out old story: "${story.title}" (published: ${story.publishedAt})`);
          return false;
        }
      }
    } catch (e) {
      console.log(`Unable to verify date for: "${story.title}" (publishedAt: ${story.publishedAt}), rejecting`);
      return false;
    }

    return false;
  }

  /**
   * Curate and summarize the gathered stories using structured output.
   */
  private async curateAndSummarizeStories(stories: WebSearchStory[]) {
    return generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        stories: z.array(z.object({
          title: z.string(),
          content: z.string(),
          url: z.string(),
          sourceName: z.string(),
        })),
      }),
      system: curateAndSummarizeStoriesPrompt,
      prompt: JSON.stringify(stories),
    });
  }
}

/**
 * Intermediate type for stories gathered from web search.
 */
interface WebSearchStory {
  title: string;
  content: string;
  url: string;
  sourceName: string;
  publishedAt: string;
}
