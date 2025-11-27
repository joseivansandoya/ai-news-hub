import Parser from 'rss-parser';
import { RSS_SOURCES, RSS_PARSER_CONFIG } from '../src/config/rssSources';

interface TestResult {
  source: string;
  success: boolean;
  itemCount?: number;
  sampleTitle?: string;
  contentLength?: number;
  error?: string;
}

async function testFeeds(): Promise<void> {
  console.log('🧪 Testing RSS Feed Accessibility...\n');

  const parser = new Parser({
    timeout: RSS_PARSER_CONFIG.timeout,
    headers: RSS_PARSER_CONFIG.headers,
  });

  const results: TestResult[] = [];

  for (const source of RSS_SOURCES) {
    console.log(`📡 Testing: ${source.name}`);
    console.log(`   URL: ${source.url}`);

    try {
      const startTime = Date.now();
      const feed = await parser.parseURL(source.url);
      const duration = Date.now() - startTime;

      const firstItem = feed.items[0];
      const content = firstItem?.content || firstItem?.contentSnippet || firstItem?.description || '';
      const wordCount = content.split(/\s+/).length;

      console.log(`   ✅ Success (${duration}ms)`);
      console.log(`   📄 Items: ${feed.items.length}`);
      console.log(`   📝 Sample title: "${firstItem?.title?.substring(0, 60)}..."`);
      console.log(`   📊 Content length: ${wordCount} words`);

      results.push({
        source: source.name,
        success: true,
        itemCount: feed.items.length,
        sampleTitle: firstItem?.title,
        contentLength: wordCount,
      });

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);

      results.push({
        source: source.name,
        success: false,
        error: error.message,
      });
    }

    console.log('');
  }

  // Summary
  console.log('📊 Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`   Success: ${successCount}/${results.length} feeds`);

  if (successCount === results.length) {
    console.log('   ✅ All feeds accessible!');
  } else {
    console.log('   ⚠️  Some feeds failed - check errors above');
  }

  // Check content length
  console.log('\n📏 Content Analysis:');
  results.forEach(result => {
    if (result.success && result.contentLength !== undefined) {
      let status = '✅';
      let note = 'Good';

      if (result.contentLength < 50) {
        status = '⚠️ ';
        note = 'Very short - might need scraping';
      } else if (result.contentLength < 100) {
        status = '⚠️ ';
        note = 'Short - monitor quality';
      } else if (result.contentLength > 1000) {
        status = 'ℹ️ ';
        note = 'Very long - will truncate';
      }

      console.log(`   ${status} ${result.source}: ${result.contentLength} words (${note})`);
    }
  });
}

testFeeds().catch(console.error);
