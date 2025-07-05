export type SupportedBotName = 
  | 'googlebot'
  | 'bingbot'
  | 'oai-searchbot'
  | 'chatgpt-user'
  | 'gptbot'
  | 'perplexitybot'
  | 'perplexity-user'
  | 'applebot'
  | 'applebot-extended'
  | 'duckassistbot'
  | 'duckduckbot';

export interface BotDetectionOptions {
  bots?: SupportedBotName[] | null;
  sanitizeIp?: boolean;
}

export interface BotGateProps {
  userAgent: string;
  ipAddress: string;
  display: 'show' | 'hide';
  role: 'bot' | 'user';
  bots?: SupportedBotName[] | null;
}


