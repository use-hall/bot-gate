import { describe, it, expect } from 'vitest';
import { validateBot } from '../src/core/index.js';

describe('validateBot', () => {
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
});