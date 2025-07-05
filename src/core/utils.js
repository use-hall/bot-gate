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
  
  return ipAddress.trim()
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');
}