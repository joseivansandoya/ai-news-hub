import { RSSSource } from '@/types';

export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    weight: 1.0,
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    weight: 1.0,
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    weight: 1.0,
  },
  {
    name: 'Import AI',
    url: 'https://importai.substack.com/feed',
    weight: 0.9,
  },
];

/**
 * RSS Parser configuration
 */
export const RSS_PARSER_CONFIG = {
  /** Timeout for each RSS feed request (milliseconds) */
  timeout: 10000, // 10 seconds
  
  /** Custom headers for RSS requests */
  headers: {
    'User-Agent': 'AI-News-Hub/0.1 (https://github.com/joseivansandoya/ai-news-hub)',
  },
  
  /** Maximum number of items to process per feed */
  maxItems: 50, // Prevent memory issues with huge feeds
};

/**
 * Content filtering configuration
 */
export const CONTENT_FILTER_CONFIG = {
  /** Only include items published within this many days */
  maxAgeDays: 2,
  
  /** Minimum content length (words) to consider valid */
  minContentLength: 50,
  
  /** Maximum content length (words) to send to LLM */
  maxContentLength: 1000, // Truncate long articles to save tokens
};

/**
 * Deduplication configuration
 */
export const DEDUPLICATION_CONFIG = {
  /** Title similarity threshold (0.0 - 1.0) */
  titleSimilarityThreshold: 0.8, // 80% similar = duplicate
  
  /** Check URL similarity (not just title) */
  checkUrlSimilarity: true,
};

/**
 * Ranking configuration
 */
export const RANKING_CONFIG = {
  /** Weight for recency in ranking (0.0 - 1.0) */
  recencyWeight: 0.7, // 70% of importance score
  
  /** Weight for source credibility (0.0 - 1.0) */
  credibilityWeight: 0.3, // 30% of importance score
  
  /** Number of top stories to select for briefing */
  topStoriesCount: 7,
};
