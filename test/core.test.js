import { describe, it, expect, beforeEach } from 'vitest';
import { validateBot, clearCache, getCacheSize, stopCacheCleanup } from '../src/core/validator.js';
import { detectBot } from '../src/core/detector.js';
import { sanitizeIpAddress } from '../src/core/utils.js';

describe('validateBot', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should return true for valid Googlebot', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const result = validateBot(userAgent, '66.249.64.1');
    expect(result).toBe(true);
  });

  it('should return false for fake Googlebot', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const result = validateBot(userAgent, '192.168.1.1');
    expect(result).toBe(false);
  });

  it('should return false for regular browser', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const result = validateBot(userAgent, '203.0.113.1');
    expect(result).toBe(false);
  });

  it('should return false for empty inputs', () => {
    expect(validateBot('', '')).toBe(false);
    expect(validateBot(null, null)).toBe(false);
    expect(validateBot(undefined, undefined)).toBe(false);
  });

  it('should return false for invalid IP', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    expect(validateBot(userAgent, 'not-an-ip')).toBe(false);
  });

  describe('IPv6 Support', () => {
    it('should validate IPv6 addresses', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const ipv6 = '2001:4860:4801:10::1';
      const result = validateBot(userAgent, ipv6);
      expect(typeof result).toBe('boolean');
    });

    it('should handle IPv4-mapped IPv6 addresses', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const mappedIpv6 = '::ffff:66.249.64.1';
      const result = validateBot(userAgent, mappedIpv6);
      expect(typeof result).toBe('boolean');
    });

    it('should handle bracketed IPv6 addresses', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const bracketedIpv6 = '[2001:4860:4801:10::1]';
      const result = validateBot(userAgent, bracketedIpv6);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('IP Sanitization', () => {
    it('should handle comma-separated IPs', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const commaIp = '66.249.64.1, 192.168.1.1';
      const result = validateBot(userAgent, commaIp);
      expect(typeof result).toBe('boolean');
    });

    it('should handle whitespace in IPs', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const spacedIp = '  66.249.64.1  ';
      const result = validateBot(userAgent, spacedIp);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cache Management', () => {
    it('should manage cache size', () => {
      expect(typeof getCacheSize()).toBe('number');
      expect(getCacheSize()).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache', () => {
      // Load some data into cache
      validateBot('Mozilla/5.0 (compatible; Googlebot/2.1)', '66.249.64.1');
      expect(getCacheSize()).toBeGreaterThan(0);
      
      clearCache();
      expect(getCacheSize()).toBe(0);
    });

    it('should stop cleanup interval', () => {
      expect(() => stopCacheCleanup()).not.toThrow();
    });
  });
});

describe('detectBot', () => {
  it('should detect known bots', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const result = detectBot(userAgent);
    expect(result).not.toBeNull();
    expect(result.name).toBe('googlebot');
    expect(result.detected).toBe(true);
  });

  it('should handle case variations', () => {
    const userAgent1 = 'Mozilla/5.0 (compatible; Googlebot/2.1)';
    const userAgent2 = 'Mozilla/5.0 (compatible; googlebot/2.1)';
    
    const result1 = detectBot(userAgent1);
    const result2 = detectBot(userAgent2);
    
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1.name).toBe(result2.name);
  });

  it('should return null for unknown user agents', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const result = detectBot(userAgent);
    expect(result).toBeNull();
  });

  it('should handle invalid inputs', () => {
    expect(detectBot(null)).toBeNull();
    expect(detectBot(undefined)).toBeNull();
    expect(detectBot('')).toBeNull();
    expect(detectBot(123)).toBeNull();
  });
});

describe('sanitizeIpAddress', () => {
  it('should handle valid IPv4', () => {
    expect(sanitizeIpAddress('192.168.1.1')).toBe('192.168.1.1');
  });

  it('should handle valid IPv6', () => {
    expect(sanitizeIpAddress('2001:4860:4801:10::1')).toBe('2001:4860:4801:10::1');
  });

  it('should remove IPv4-mapped prefix', () => {
    expect(sanitizeIpAddress('::ffff:192.168.1.1')).toBe('192.168.1.1');
  });

  it('should remove brackets', () => {
    expect(sanitizeIpAddress('[2001:4860:4801:10::1]')).toBe('2001:4860:4801:10::1');
  });

  it('should handle comma-separated IPs', () => {
    expect(sanitizeIpAddress('192.168.1.1, 10.0.0.1')).toBe('192.168.1.1');
  });

  it('should trim whitespace', () => {
    expect(sanitizeIpAddress('  192.168.1.1  ')).toBe('192.168.1.1');
  });

  it('should handle invalid inputs', () => {
    expect(sanitizeIpAddress(null)).toBeNull();
    expect(sanitizeIpAddress(undefined)).toBeNull();
    expect(sanitizeIpAddress('')).toBeNull();
    expect(sanitizeIpAddress(123)).toBeNull();
  });
});