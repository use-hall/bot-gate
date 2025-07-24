// Core validation function
export function validateBot(userAgent: string, ipAddress: string): boolean;

// Utility functions
export function warnIfClientSide(): void;

// Cache management functions
export function clearCache(): void;
export function getCacheSize(): number;
export function stopCacheCleanup(): void;

// Bot detection types
export interface BotInfo {
  name: string;
  type: 'search' | 'ai';
  detected: boolean;
  pattern: string;
}

export interface SupportedBot {
  name: string;
  type: 'search' | 'ai';
}

// Bot detection functions
export function detectBot(userAgent: string): BotInfo | null;
export function getSupportedBots(): SupportedBot[];

// IP address utilities
export function sanitizeIpAddress(ipAddress: string): string | null;
export function isServerSide(): boolean;

// Debugging utilities
export interface DebugValidationResult {
  valid: boolean;
  reason: string;
  botInfo?: BotInfo;
  cleanIp?: string;
  availableRanges?: number;
  botError?: string;
}

export interface BotValidationInfo {
  botName: string;
  rangeCount: number;
  error?: string;
  errorMessage?: string;
  loadedAt?: number;
  ranges: string[];
}

export function debugBotValidation(userAgent: string, ipAddress: string): DebugValidationResult;
export function getBotValidationInfo(botName: string): BotValidationInfo;
export function listCachedBots(): string[];