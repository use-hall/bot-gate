import React from 'react';
import { warnIfClientSide } from '../../core/index.js';
import { validateBotGateProps, isValidBot } from '../../core/shared-validation.js';

export function BotGate({ 
  userAgent,
  ipAddress,
  display,
  role,
  bots = null,
  children
}) {
  React.useEffect(() => {
    warnIfClientSide();
  }, []);

  const validation = validateBotGateProps(userAgent, ipAddress, display, role);
  if (!validation.isValid) {
    return null;
  }

  const isBot = isValidBot(userAgent, ipAddress, bots);
  const shouldShow = (display === 'show') ? 
    (role === 'bot' ? isBot : !isBot) : 
    (role === 'bot' ? !isBot : isBot);

  return shouldShow ? children : null;
}


