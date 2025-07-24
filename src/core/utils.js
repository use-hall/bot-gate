export function isServerSide() {
  return typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node;
}

export function warnIfClientSide() {
  if (!isServerSide()) {
    console.warn('bot-gate: This library is designed for server-side use only. Bot detection requires access to request headers and IP addresses that are not available in the browser.');
  }
}

export function sanitizeIpAddress(ipAddress) {
  if (!ipAddress || typeof ipAddress !== 'string') return null;
  
  let sanitized = ipAddress.trim()
    .split(',')[0]
    .trim();
  
  // Remove IPv4-mapped IPv6 prefix if present
  if (sanitized.startsWith('::ffff:')) {
    sanitized = sanitized.replace(/^::ffff:/, '');
  }
  
  // Handle IPv6 addresses enclosed in brackets (common in HTTP headers)
  if (sanitized.startsWith('[') && sanitized.endsWith(']')) {
    sanitized = sanitized.slice(1, -1);
  }
  
  return sanitized;
}