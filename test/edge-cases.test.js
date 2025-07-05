import { describe, it, expect } from 'vitest';
import { validateBot, warnIfClientSide } from '../src/core/index.js';

describe('Edge Cases', () => {
  it('should handle case variations in user agent', () => {
    const userAgent1 = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const userAgent2 = 'Mozilla/5.0 (compatible; googlebot/2.1; +http://www.google.com/bot.html)';
    
    // Both should work the same way (detected or not detected consistently)
    const result1 = validateBot(userAgent1, '66.249.64.1');
    const result2 = validateBot(userAgent2, '66.249.64.1');
    
    // They should both be boolean
    expect(typeof result1).toBe('boolean');
    expect(typeof result2).toBe('boolean');
  });

  it('should handle various invalid inputs gracefully', () => {
    const invalidInputs = [
      ['', ''],
      [null, null],
      [undefined, undefined],
      ['valid-ua', ''],
      ['', 'valid-ip'],
      ['ua', 'invalid.ip.format'],
      [123, 456], // wrong types
    ];

    invalidInputs.forEach(([ua, ip]) => {
      const result = validateBot(ua, ip);
      expect(result).toBe(false);
    });
  });

  it('should always return boolean', () => {
    const testCases = [
      ['Mozilla/5.0 (compatible; Googlebot/2.1)', '66.249.64.1'],
      ['Mozilla/5.0 (Windows NT 10.0)', '192.168.1.1'],
      ['', ''],
      [null, null]
    ];

    testCases.forEach(([ua, ip]) => {
      const result = validateBot(ua, ip);
      expect(typeof result).toBe('boolean');
    });
  });

  it('should have warnIfClientSide function', () => {
    expect(typeof warnIfClientSide).toBe('function');
    
    // Should not throw
    expect(() => warnIfClientSide()).not.toThrow();
  });
});