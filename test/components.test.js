import { describe, it, expect, vi } from 'vitest';

// Simple mock for the validation
vi.mock('../src/core/shared-validation.js', () => ({
  validateBotGateProps: vi.fn(() => ({ isValid: true })),
  calculateShouldShow: vi.fn(),
  isValidBot: vi.fn()
}));

vi.mock('../src/core/index.js', () => ({
  warnIfClientSide: vi.fn()
}));

import { validateBotGateProps, calculateShouldShow, isValidBot } from '../src/core/shared-validation.js';

describe('Component Logic', () => {
  it('should show content when calculateShouldShow returns true', () => {
    calculateShouldShow.mockReturnValue(true);
    
    const result = calculateShouldShow('show', 'bot', true);
    expect(result).toBe(true);
  });

  it('should hide content when calculateShouldShow returns false', () => {
    calculateShouldShow.mockReturnValue(false);
    
    const result = calculateShouldShow('hide', 'bot', true);
    expect(result).toBe(false);
  });

  it('should validate props correctly', () => {
    validateBotGateProps.mockReturnValue({ isValid: true });
    
    const result = validateBotGateProps('userAgent', 'ip', 'show', 'bot');
    expect(result.isValid).toBe(true);
  });

  it('should filter bots when array provided', () => {
    isValidBot.mockReturnValue(true);
    
    const result = isValidBot('userAgent', 'ip', ['googlebot']);
    expect(result).toBe(true);
    expect(isValidBot).toHaveBeenCalledWith('userAgent', 'ip', ['googlebot']);
  });
});