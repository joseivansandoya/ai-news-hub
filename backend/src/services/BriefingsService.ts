import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import {
  webSearchStoriesPrompt,
  curateAndSummarizeStoriesPrompt,
} from '@/services/prompts/webSearchStories';

export class BriefingsService {
  constructor() { }

  /**
   * Generate briefing using LLM-orchestrated web search.
   *
   * Workflow:
   * 1. SEARCH PHASE: LLM uses web search tool to find top AI news stories
   * 2. CURATE PHASE: LLM deduplicates, ranks, and summarizes into exactly 6 stories
   */
  async generate() {
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

    return {
      stories: curationResult.object.stories,
      metadata: {
        totalItemsFetched: rawStories.length,
        storiesAfterDedup: curationResult.object.stories.length,
        generationTimeMs: 0,
        llmTokensUsed,
        llmCost,
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
   */
  private parseStoriesFromSearchResult(text: string): WebSearchStory[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(story => ({
            title: story.title || '',
            content: story.content || story.description || '',
            url: story.url || story.link || '',
            sourceName: story.sourceName || story.source || '',
            publishedAt: story.publishedAt || 'recent',
          }));
        }
      }
    } catch (e) {
      console.error('Failed to parse search results as JSON:', e);
    }

    return [];
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
