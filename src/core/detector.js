import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let userAgentPatterns = null;

function loadUserAgentPatterns() {
  if (!userAgentPatterns) {
    try {
      const dataPath = path.join(__dirname, '../../data/user-agents.json');
      const data = fs.readFileSync(dataPath, 'utf8');
      userAgentPatterns = JSON.parse(data);
    } catch (error) {
      console.warn('Failed to load user agent patterns:', error.message);
      userAgentPatterns = { bots: [] };
    }
  }
  return userAgentPatterns;
}

export function detectBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return null;
  }

  const patterns = loadUserAgentPatterns();
  const normalizedUA = userAgent.toLowerCase();

  for (const bot of patterns.bots) {
    for (const pattern of bot.patterns) {
      const regex = new RegExp(pattern.toLowerCase(), 'i');
      if (regex.test(normalizedUA)) {
        return {
          name: bot.name,
          type: bot.type,
          detected: true,
          pattern: pattern
        };
      }
    }
  }

  return null;
}

export function getSupportedBots() {
  const patterns = loadUserAgentPatterns();
  return patterns.bots.map(bot => ({
    name: bot.name,
    type: bot.type
  }));
}