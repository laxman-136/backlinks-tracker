import type { JWTPayload } from './auth';

// Helper to decode Base64URL to string safely handling UTF-8 characters
function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Verify HMAC-SHA256 signature using standard Web Crypto API
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const secret = process.env.JWT_SECRET || 'fallback_secret';

    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    
    // Import the secret key for verification
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Reconstruct the signed message data
    const message = `${headerB64}.${payloadB64}`;
    const messageData = enc.encode(message);

    // Decode the signature from base64url
    let base64Sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const sigBinary = atob(base64Sig);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    // Verify signature using native Web Crypto API
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      messageData
    );

    if (!isValid) {
      console.log('[verifyTokenEdge] Signature verification failed');
      return null;
    }

    // Parse claims
    const payloadStr = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadStr) as JWTPayload;

    // Check expiration (exp is standard JWT claim in seconds)
    const exp = (payload as any).exp;
    if (exp && Date.now() >= exp * 1000) {
      console.log('[verifyTokenEdge] Token has expired');
      return null;
    }

    return payload;
  } catch (err: any) {
    console.error('[verifyTokenEdge] Error:', err.message);
    return null;
  }
}
