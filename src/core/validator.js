import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectBot } from './detector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ipRangeCache = new Map();

function loadBotIpRanges(botName) {
  if (!ipRangeCache.has(botName)) {
    try {
      // Handle applebot-extended using the same IP ranges as applebot
      let actualBotName = botName.toLowerCase();
      if (actualBotName === 'applebot-extended') {
        actualBotName = 'applebot';
      }
      
      const dataPath = path.join(__dirname, `../../data/bots/${actualBotName}.json`);
      const data = fs.readFileSync(dataPath, 'utf8');
      const rawData = JSON.parse(data);
      
      // Official API format: { creationTime, prefixes: [{ ipv4Prefix: "..." }] }
      const ranges = rawData.prefixes 
        ? rawData.prefixes.map(prefix => prefix.ipv4Prefix || prefix.ipv6Prefix).filter(Boolean)
        : [];
      
      ipRangeCache.set(botName, { ranges });
    } catch (error) {
      console.warn(`Failed to load IP ranges for ${botName}:`, error.message);
      ipRangeCache.set(botName, { ranges: [] });
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

function isIpInRange(ip, range) {
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
  return ipv4Regex.test(ip);
}

function validateBotByName(botName, ipAddress) {
  if (!botName || !ipAddress) {
    return false;
  }

  if (!isValidIpAddress(ipAddress)) {
    return false;
  }

  const botData = loadBotIpRanges(botName);
  
  if (!botData.ranges || botData.ranges.length === 0) {
    return false;
  }

  return botData.ranges.some(range => isIpInRange(ipAddress, range));
}

export function validateBot(userAgent, ipAddress) {
  if (!userAgent || !ipAddress) {
    return false;
  }

  const botInfo = detectBot(userAgent);
  
  if (!botInfo) {
    return false;
  }

  return validateBotByName(botInfo.name, ipAddress);
}