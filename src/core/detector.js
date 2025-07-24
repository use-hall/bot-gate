import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let userAgentPatterns = null;
let compiledPatterns = null;

function loadUserAgentPatterns() {
  if (!userAgentPatterns) {
    try {
      const dataPath = path.join(__dirname, '../../data/user-agents.json');
      
      if (!fs.existsSync(dataPath)) {
        console.warn('bot-gate: User agent patterns file not found. Bot detection will be disabled.');
        userAgentPatterns = { bots: [] };
        return userAgentPatterns;
      }
      
      const data = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Validate structure
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.bots)) {
        console.warn('bot-gate: Invalid user agent patterns format. Expected { bots: [...] }');
        userAgentPatterns = { bots: [] };
        return userAgentPatterns;
      }
      
      // Validate each bot entry
      const validBots = parsed.bots.filter(bot => {
        if (!bot || typeof bot !== 'object' || !bot.name || !Array.isArray(bot.patterns)) {
          console.warn(`bot-gate: Invalid bot entry skipped:`, bot);
          return false;
        }
        return true;
      });
      
      userAgentPatterns = { bots: validBots };
      
      if (validBots.length === 0) {
        console.warn('bot-gate: No valid bot patterns found. Bot detection will be disabled.');
      }
      
      // Pre-compile regex patterns for better performance
      compilePatterns();
      
    } catch (error) {
      console.warn('bot-gate: Failed to load user agent patterns:', error.message);
      userAgentPatterns = { bots: [] };
    }
  }
  return userAgentPatterns;
}

function compilePatterns() {
  if (!userAgentPatterns || !userAgentPatterns.bots) {
    compiledPatterns = [];
    return;
  }
  
  compiledPatterns = userAgentPatterns.bots.map(bot => {
    const regexPatterns = bot.patterns.map(pattern => {
      try {
        return new RegExp(pattern, 'i');
      } catch (error) {
        console.warn(`bot-gate: Invalid regex pattern "${pattern}" for bot ${bot.name}:`, error.message);
        return null;
      }
    }).filter(Boolean);
    
    return {
      name: bot.name,
      type: bot.type,
      regexPatterns
    };
  }).filter(bot => bot.regexPatterns.length > 0);
}

export function detectBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return null;
  }

  // Ensure patterns are loaded and compiled
  if (!compiledPatterns) {
    loadUserAgentPatterns();
    if (!compiledPatterns) {
      compilePatterns();
    }
  }

  if (!compiledPatterns || compiledPatterns.length === 0) {
    return null;
  }

  for (const bot of compiledPatterns) {
    for (const regex of bot.regexPatterns) {
      if (regex.test(userAgent)) {
        return {
          name: bot.name,
          type: bot.type,
          detected: true,
          pattern: regex.source
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