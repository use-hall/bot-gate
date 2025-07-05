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


export interface BotGateProps {
  userAgent: string;
  ipAddress: string;
  display: 'show' | 'hide';
  role: 'bot' | 'user';
  bots?: SupportedBotName[] | null;
}


