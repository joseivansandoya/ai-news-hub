import Parser from 'rss-parser';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import { RSS_SOURCES, RSS_PARSER_CONFIG } from '@/config/rssSources';
import { RSSResult, RSSSource } from '@/types';
import { deduplicateAndSelectStoriesPrompt } from '@/services/prompts/deduplicateAndSelectStories';

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
}
