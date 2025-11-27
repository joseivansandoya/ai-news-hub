import Parser from 'rss-parser';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import { RSS_SOURCES, RSS_PARSER_CONFIG } from '@/config/rssSources';

export class BriefingsService {
  constructor() { }

  async generate() {
    const rssResults: any = [];
    // 1. obtain rss feed data
    const parser = new Parser({
      timeout: RSS_PARSER_CONFIG.timeout,
      headers: RSS_PARSER_CONFIG.headers,
    });
    for (const source of RSS_SOURCES) {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (pubDate && pubDate >= yesterday) {
          rssResults.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: source.name,
            content: (item.content || item.contentSnippet || item.description || '').replace(/<[^>]*>/g, '').substring(0, 800),
          })
        }
      }
    }

    // 1. Define the request to the LLM
    const result = generateObject({
      model: openai('gpt-4o'),
      output: 'array',
      schema: z.array(z.object({
        title: z.string(),
        content: z.string(),
        url: z.string(),
        sourceName: z.string(),
      })),
      system: `You are an AI news curator specializing in artificial intelligence and technology news. Your task is to deduplicate and select the most interesting stories from an RSS feed collection.

        INPUT FORMAT:
        You will receive a JSON array of stories with this structure:
        [
          {
            "title": "string",
            "content": "string (excerpt or full text)",
            "url": "string",
            "sourceName": "string",
            "publishedAt": "ISO 8601 timestamp"
          }
        ]

        YOUR TASK:
        1. DEDUPLICATE: Identify stories covering the same topic/event even if worded differently. Keep only ONE story per topic, preferring:
          - More recent publication date
          - More detailed content
          - More authoritative source (OpenAI/Anthropic blogs > news sites > aggregators)

        2. SELECT TOP 6: From deduplicated stories, choose the 6 MOST INTERESTING based on:
          - Significance: Major announcements, research breakthroughs, industry shifts
          - Recency: Prefer newer stories (published in last 24-48 hours)
          - Relevance: Core AI/ML developments over tangential tech news
          - Credibility: Original sources over secondary reporting

        3. RANK: Order the 6 stories by importance (most important first)

        OUTPUT FORMAT:
        Return ONLY a valid JSON array with exactly this structure (NO markdown, NO backticks, NO explanations):

        [
          {
            "title": "exact title from input",
            "content": "exact content from input", 
            "url": "exact url from input",
            "sourceName": "exact source name from input"
          }
        ]

        CRITICAL RULES:
        - Output MUST be valid JSON only - no text before or after
        - Return exactly 6 stories (or fewer if less than 6 unique stories exist)
        - Use exact values from input - do not modify title/content/url/sourceName
        - Do not include publishedAt in output
        - If multiple stories cover same topic, keep only the best one
        - Remove any special characters or HTML tags from the content

        BEGIN PROCESSING:`,
      prompt: JSON.stringify(rssResults),
    });

    return await result;
  }
}
