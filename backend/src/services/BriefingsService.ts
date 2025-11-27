import Parser from 'rss-parser';

import { RSS_SOURCES, RSS_PARSER_CONFIG } from '@/config/rssSources';

export class BriefingsService {
  constructor() {}

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

    return rssResults;
  }
}
