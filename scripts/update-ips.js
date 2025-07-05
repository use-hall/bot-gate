#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const BOTS_DIR = path.join(DATA_DIR, 'bots');

const BOT_SOURCES = {
  'googlebot': 'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'oai-searchbot': 'https://openai.com/searchbot.json',
  'chatgpt-user': 'https://openai.com/chatgpt-user.json',
  'gptbot': 'https://openai.com/gptbot.json',
  'perplexitybot': 'https://www.perplexity.ai/perplexitybot.json',
  'perplexity-user': 'https://www.perplexity.ai/perplexity-user.json',
  'bingbot': 'https://www.bing.com/toolbox/bingbot.json',
  'applebot': 'https://search.developer.apple.com/applebot.json',
  'duckassistbot': 'https://duckduckgo.com/duckassistbot.json',
  'duckduckbot': 'https://duckduckgo.com/duckduckbot.json'
};

function calculateChecksum(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'bot-gate IP updater'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error.message);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function updateBotIpRanges(botName, sourceUrl) {
  const filePath = path.join(BOTS_DIR, `${botName}.json`);
  
  try {
    console.log(`Updating ${botName} IP ranges from ${sourceUrl}`);
    
    const data = await fetchWithRetry(sourceUrl);
    
    if (!data.prefixes || data.prefixes.length === 0) {
      console.warn(`No IP ranges found for ${botName}`);
      return false;
    }
    
    const newChecksum = calculateChecksum(data);
    
    let existingData = null;
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    if (existingData && calculateChecksum(existingData) === newChecksum) {
      console.log(`${botName} IP ranges are up to date`);
      return false;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✓ Updated ${botName} with ${data.prefixes.length} IP ranges`);
    return true;
    
  } catch (error) {
    console.error(`Failed to update ${botName}:`, error.message);
    return false;
  }
}


async function main() {
  console.log('Starting IP ranges update...');
  
  let hasUpdates = false;
  
  for (const [botName, sourceUrl] of Object.entries(BOT_SOURCES)) {
    const updated = await updateBotIpRanges(botName, sourceUrl);
    if (updated) {
      hasUpdates = true;
    }
  }
  
  if (hasUpdates) {
    console.log('✓ IP ranges update completed with changes');
    process.exit(0);
  } else {
    console.log('✓ IP ranges update completed - no changes needed');
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  });
}