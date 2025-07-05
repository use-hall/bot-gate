import { detectBot } from './detector.js';
import { validateBot } from './validator.js';
import { sanitizeIpAddress } from './utils.js';

export function validateBotGateProps(userAgent, ipAddress, display, role) {
  if (!userAgent || !ipAddress) {
    console.warn('BotGate: userAgent and ipAddress are required props');
    return { isValid: false, error: 'missing_required_props' };
  }

  if (!display) {
    console.warn('BotGate: display prop is required ("show" or "hide")');
    return { isValid: false, error: 'missing_display' };
  }

  if (!role) {
    console.warn('BotGate: role prop is required ("bot" or "user")');
    return { isValid: false, error: 'missing_role' };
  }

  if (!['show', 'hide'].includes(display)) {
    console.warn('BotGate: display must be either "show" or "hide"');
    return { isValid: false, error: 'invalid_display' };
  }

  if (!['bot', 'user'].includes(role)) {
    console.warn('BotGate: role must be either "bot" or "user"');
    return { isValid: false, error: 'invalid_role' };
  }

  return { isValid: true };
}


export function isValidBot(userAgent, ipAddress, bots = null) {
  const cleanIp = sanitizeIpAddress(ipAddress);
  const isValid = validateBot(userAgent, cleanIp);
  
  if (!isValid) {
    return false;
  }
  
  // If specific bots are requested, check if this bot is in the list
  if (bots && Array.isArray(bots) && bots.length > 0) {
    const botInfo = detectBot(userAgent);
    return botInfo ? bots.includes(botInfo.name) : false;
  }
  
  return true;
}