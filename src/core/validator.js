import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectBot } from './detector.js';
import { sanitizeIpAddress } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ipRangeCache = new Map();

// Cache configuration
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of cached bot entries

function cleanupCache() {
  const now = Date.now();
  const entries = Array.from(ipRangeCache.entries());
  
  // Remove expired entries
  for (const [botName, data] of entries) {
    if (data.loadedAt && (now - data.loadedAt) > CACHE_TTL) {
      ipRangeCache.delete(botName);
    }
  }
  
  // If still over size limit, remove oldest entries
  if (ipRangeCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(ipRangeCache.entries())
      .sort(([,a], [,b]) => (a.loadedAt || 0) - (b.loadedAt || 0));
    
    const toRemove = sortedEntries.slice(0, ipRangeCache.size - MAX_CACHE_SIZE);
    for (const [botName] of toRemove) {
      ipRangeCache.delete(botName);
    }
  }
}

// Periodic cleanup every 10 minutes
let cleanupInterval;
if (typeof setInterval !== 'undefined') {
  cleanupInterval = setInterval(cleanupCache, 10 * 60 * 1000);
}

function loadBotIpRanges(botName) {
  if (!ipRangeCache.has(botName)) {
    // Cleanup cache before adding new entries
    cleanupCache();
    try {
      // Handle applebot-extended using the same IP ranges as applebot
      let actualBotName = botName.toLowerCase();
      if (actualBotName === 'applebot-extended') {
        actualBotName = 'applebot';
      }
      
      const dataPath = path.join(__dirname, `../../data/bots/${actualBotName}.json`);
      
      if (!fs.existsSync(dataPath)) {
        console.warn(`bot-gate: IP ranges file not found for ${botName}. Bot validation will fail for this bot.`);
        ipRangeCache.set(botName, { ranges: [], error: 'file_not_found' });
        return ipRangeCache.get(botName);
      }
      
      const data = fs.readFileSync(dataPath, 'utf8');
      let rawData;
      
      try {
        rawData = JSON.parse(data);
      } catch (parseError) {
        console.warn(`bot-gate: Invalid JSON in IP ranges file for ${botName}:`, parseError.message);
        ipRangeCache.set(botName, { ranges: [], error: 'invalid_json' });
        return ipRangeCache.get(botName);
      }
      
      // Validate structure
      if (!rawData || typeof rawData !== 'object') {
        console.warn(`bot-gate: Invalid IP ranges data structure for ${botName}. Expected object.`);
        ipRangeCache.set(botName, { ranges: [], error: 'invalid_structure' });
        return ipRangeCache.get(botName);
      }
      
      // Official API format: { creationTime, prefixes: [{ ipv4Prefix: "..." }] }
      const ranges = rawData.prefixes && Array.isArray(rawData.prefixes)
        ? rawData.prefixes.map(prefix => prefix.ipv4Prefix || prefix.ipv6Prefix).filter(Boolean)
        : [];
      
      if (ranges.length === 0) {
        console.warn(`bot-gate: No valid IP ranges found for ${botName}. Bot validation will fail for this bot.`);
      }
      
      ipRangeCache.set(botName, { 
        ranges, 
        loadedAt: Date.now(),
        error: ranges.length === 0 ? 'no_ranges' : null 
      });
      
    } catch (error) {
      console.warn(`bot-gate: Failed to load IP ranges for ${botName}:`, error.message);
      ipRangeCache.set(botName, { ranges: [], error: 'load_failed', errorMessage: error.message });
    }
  }
  return ipRangeCache.get(botName);
}

function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function cidrToRange(cidr) {
  const [ip, prefixLength] = cidr.split('/');
  const ipInt = ipToInt(ip);
  const mask = (-1 << (32 - parseInt(prefixLength, 10))) >>> 0;
  const networkInt = ipInt & mask;
  const broadcastInt = networkInt | (~mask >>> 0);
  
  return {
    start: networkInt,
    end: broadcastInt
  };
}

function expandIpv6(ip) {
  // Expand IPv6 address to full form
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0000');
    return [...left, ...middle, ...right].map(part => part.padStart(4, '0')).join(':');
  }
  return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}

function ipv6ToInts(ip) {
  const expanded = expandIpv6(ip);
  const parts = expanded.split(':');
  return parts.map(part => parseInt(part, 16));
}

function isIpv6InRange(ip, range) {
  if (!ip.includes(':')) return false;
  
  if (range.includes('/')) {
    const [rangeIp, prefixLength] = range.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    if (!rangeIp.includes(':')) return false;
    
    const ipParts = ipv6ToInts(ip);
    const rangeParts = ipv6ToInts(rangeIp);
    
    // Check how many complete 16-bit blocks we need to compare
    const completeBlocks = Math.floor(prefix / 16);
    const remainingBits = prefix % 16;
    
    // Compare complete blocks
    for (let i = 0; i < completeBlocks; i++) {
      if (ipParts[i] !== rangeParts[i]) {
        return false;
      }
    }
    
    // Compare remaining bits in the partial block
    if (remainingBits > 0 && completeBlocks < 8) {
      const mask = (0xFFFF << (16 - remainingBits)) & 0xFFFF;
      if ((ipParts[completeBlocks] & mask) !== (rangeParts[completeBlocks] & mask)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Direct IPv6 comparison
  if (range.includes(':')) {
    return expandIpv6(ip) === expandIpv6(range);
  }
  
  return false;
}

function isIpInRange(ip, range) {
  // Handle IPv6 ranges
  if (ip.includes(':') || range.includes(':')) {
    return isIpv6InRange(ip, range);
  }
  
  // Handle IPv4 ranges
  const ipInt = ipToInt(ip);
  
  if (range.includes('/')) {
    const { start, end } = cidrToRange(range);
    return ipInt >= start && ipInt <= end;
  }
  
  if (range.includes('-')) {
    const [startIp, endIp] = range.split('-');
    const startInt = ipToInt(startIp.trim());
    const endInt = ipToInt(endIp.trim());
    return ipInt >= startInt && ipInt <= endInt;
  }
  
  return ipInt === ipToInt(range);
}

function isValidIpAddress(ip) {
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:)+[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:)+::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:)+::[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function validateBotByName(botName, ipAddress) {
  if (!botName || !ipAddress) {
    return false;
  }

  const cleanIp = sanitizeIpAddress(ipAddress);
  if (!cleanIp || !isValidIpAddress(cleanIp)) {
    return false;
  }

  const botData = loadBotIpRanges(botName);
  
  if (!botData.ranges || botData.ranges.length === 0) {
    return false;
  }

  return botData.ranges.some(range => isIpInRange(cleanIp, range));
}

export function validateBot(userAgent, ipAddress) {
  if (!userAgent || !ipAddress) {
    return false;
  }

  const cleanIp = sanitizeIpAddress(ipAddress);
  if (!cleanIp) {
    console.warn(`bot-gate: Failed to sanitize IP address: ${ipAddress}`);
    return false;
  }

  const botInfo = detectBot(userAgent);
  
  if (!botInfo) {
    return false;
  }

  const isValid = validateBotByName(botInfo.name, cleanIp);
  if (!isValid) {
    console.warn(`bot-gate: Bot validation failed for ${botInfo.name} with IP ${cleanIp}. This may indicate a spoofed bot or outdated IP ranges.`);
  }

  return isValid;
}

// Export cache management functions for testing and manual cleanup
export function clearCache() {
  ipRangeCache.clear();
}

export function getCacheSize() {
  return ipRangeCache.size;
}

export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Debugging utilities
export function debugBotValidation(userAgent, ipAddress) {
  console.log('bot-gate: Debug validation starting...');
  console.log(`User-Agent: ${userAgent}`);
  console.log(`IP Address: ${ipAddress}`);
  
  if (!userAgent || !ipAddress) {
    console.log('❌ Missing required parameters');
    return { valid: false, reason: 'missing_params' };
  }

  const cleanIp = sanitizeIpAddress(ipAddress);
  console.log(`Sanitized IP: ${cleanIp}`);
  
  if (!cleanIp) {
    console.log('❌ IP sanitization failed');
    return { valid: false, reason: 'ip_sanitization_failed' };
  }

  if (!isValidIpAddress(cleanIp)) {
    console.log('❌ Invalid IP address format');
    return { valid: false, reason: 'invalid_ip_format' };
  }

  const botInfo = detectBot(userAgent);
  console.log(`Bot detection result:`, botInfo);
  
  if (!botInfo) {
    console.log('❌ No bot detected in user agent');
    return { valid: false, reason: 'bot_not_detected' };
  }

  const botData = loadBotIpRanges(botInfo.name);
  console.log(`Bot IP ranges loaded: ${botData.ranges.length} ranges`);
  
  if (botData.error) {
    console.log(`❌ Bot data error: ${botData.error}`);
    return { valid: false, reason: 'bot_data_error', botError: botData.error };
  }

  const isInRange = botData.ranges.some(range => {
    const inRange = isIpInRange(cleanIp, range);
    if (inRange) {
      console.log(`✅ IP ${cleanIp} matches range: ${range}`);
    }
    return inRange;
  });

  if (!isInRange) {
    console.log(`❌ IP ${cleanIp} not in any valid ranges for ${botInfo.name}`);
    console.log('Available ranges:', botData.ranges.slice(0, 5)); // Show first 5 ranges
  }

  const result = { 
    valid: isInRange, 
    reason: isInRange ? 'valid_bot' : 'ip_not_in_range',
    botInfo,
    cleanIp,
    availableRanges: botData.ranges.length
  };
  
  console.log('bot-gate: Debug validation complete:', result);
  return result;
}

export function getBotValidationInfo(botName) {
  const botData = loadBotIpRanges(botName);
  return {
    botName,
    rangeCount: botData.ranges.length,
    error: botData.error,
    errorMessage: botData.errorMessage,
    loadedAt: botData.loadedAt,
    ranges: botData.ranges.slice(0, 10) // First 10 ranges for inspection
  };
}

export function listCachedBots() {
  return Array.from(ipRangeCache.keys());
}