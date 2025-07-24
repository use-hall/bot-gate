import { detectBot } from './detector.js';
import { validateBot } from './validator.js';
import { sanitizeIpAddress } from './utils.js';

export function validateBotGateProps(userAgent, ipAddress, display, role) {
  if (!userAgent || !ipAddress) {
    console.warn(`bot-gate: Missing required props. userAgent: ${userAgent ? 'provided' : 'missing'}, ipAddress: ${ipAddress ? 'provided' : 'missing'}. Both are required for bot detection.`);
    return { isValid: false, error: 'missing_required_props' };
  }

  if (!display) {
    console.warn('bot-gate: display prop is required. Must be either "show" or "hide" to control content visibility.');
    return { isValid: false, error: 'missing_display' };
  }

  if (!role) {
    console.warn('bot-gate: role prop is required. Must be either "bot" or "user" to specify the target audience.');
    return { isValid: false, error: 'missing_role' };
  }

  if (!['show', 'hide'].includes(display)) {
    console.warn(`bot-gate: Invalid display value "${display}". Must be either "show" (to display content) or "hide" (to hide content).`);
    return { isValid: false, error: 'invalid_display' };
  }

  if (!['bot', 'user'].includes(role)) {
    console.warn(`bot-gate: Invalid role value "${role}". Must be either "bot" (for search engines/crawlers) or "user" (for human visitors).`);
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