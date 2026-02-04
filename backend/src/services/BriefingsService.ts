import Parser from 'rss-parser';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import { RSS_SOURCES, RSS_PARSER_CONFIG } from '@/config/rssSources';
import { RSSResult, RSSSource } from '@/types';
import { deduplicateAndSelectStoriesPrompt } from '@/services/prompts/deduplicateAndSelectStories';
import {
  webSearchStoriesPrompt,
  curateAndSummarizeStoriesPrompt,
} from '@/services/prompts/webSearchStories';

export class BriefingsService {
  constructor() { }

  async generate() {
    const rssResults = await this.extractRSSFeedData(RSS_SOURCES);
    const llmResponse = await this.deduplicateAndSelectStories(rssResults);
    const llmTokensUsed = llmResponse.usage.totalTokens || 0;
    const inputTokens = llmResponse.usage.inputTokens || 0;
    const outputTokens = llmResponse.usage.outputTokens || 0;
    const llmCost = this.calculateLLMCost(inputTokens, outputTokens);

    return {
      stories: llmResponse.object[0],
      metadata: {
        totalItemsFetched: rssResults.length,
        storiesAfterDedup: llmResponse.object[0].length,
        generationTimeMs: parseInt(llmResponse.response.headers?.['openai-processing-ms'] || '0'),
        llmTokensUsed,
        llmCost,
      },
    };
  }

  private async extractRSSFeedData(sources: RSSSource[]): Promise<RSSResult[]> {
    const rssResults: RSSResult[] = [];
    const parser = new Parser({
      timeout: RSS_PARSER_CONFIG.timeout,
      headers: RSS_PARSER_CONFIG.headers,
    });
    for (const source of sources) {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);

        if (pubDate && pubDate >= yesterday) {
          rssResults.push({
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            source: source.name || '',
            content: (item.content || item.contentSnippet || item.description || '').replace(/<[^>]*>/g, '').substring(0, 800),
          });
        }
      }
    }

    return rssResults;
  }

  private async deduplicateAndSelectStories(stories: RSSResult[]) {
    return generateObject({
      model: openai('gpt-4o'),
      output: 'array',
      schema: z.array(z.object({
        title: z.string(),
        content: z.string(),
        url: z.string(),
        sourceName: z.string(),
      })),
      system: deduplicateAndSelectStoriesPrompt,
      prompt: JSON.stringify(stories),
    });
  }

  private calculateLLMCost(inputTokens: number, outputTokens: number) {
    // GPT-4o pricing
    const inputRate = 2.50 / 1000000;
    const outputRate = 10.00 / 1000000;
    const llmCost = (inputTokens * inputRate) + (outputTokens * outputRate);

    return llmCost;
  }

  /**
   * POC: Generate briefing using LLM-orchestrated web search instead of RSS feeds.
   *
   * Workflow:
   * 1. SEARCH PHASE: LLM uses web search tool to find top AI news (at least 10 stories)
   * 2. CURATE PHASE: LLM deduplicates, ranks, and summarizes into exactly 6 stories
   *
   * This method returns the same data structure as generate() for compatibility.
   */
  async generateWithWebSearch() {
    // Phase 1: Web Search - LLM searches for AI news
    const searchResult = await this.searchForStories();
    const rawStories = this.parseStoriesFromSearchResult(searchResult.text);

    // Phase 2: Curate & Summarize - LLM processes the gathered stories
    const curationResult = await this.curateAndSummarizeStories(rawStories);

    // Calculate combined token usage
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
        generationTimeMs: 0, // Not available from Responses API in the same way
        llmTokensUsed,
        llmCost,
      },
    };
  }

  /**
   * Phase 1: Use LLM with web search tool to find AI news stories.
   * The LLM will autonomously search the web and gather news.
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
   * The LLM should return JSON, but we handle text gracefully.
   */
  private parseStoriesFromSearchResult(text: string): WebSearchStory[] {
    try {
      // Try to extract JSON from the response
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

    // Fallback: return empty array if parsing fails
    // In production, you might want to retry or handle this differently
    return [];
  }

  /**
   * Phase 2: Curate and summarize the gathered stories.
   * Uses structured output to ensure consistent format.
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
 * This includes publishedAt which is used during curation but not in final output.
 */
interface WebSearchStory {
  title: string;
  content: string;
  url: string;
  sourceName: string;
  publishedAt: string;
}
