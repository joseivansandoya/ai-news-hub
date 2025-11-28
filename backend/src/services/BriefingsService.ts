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
    return this.deduplicateAndSelectStories(rssResults);
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
        yesterday.setDate(yesterday.getDate() - 1);

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
}
