import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ID_ENCRYPTION_KEY as string;
const IV_LENGTH = 16;

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string): Buffer {
  value = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = value.length % 4;
  if (pad) value += '='.repeat(4 - pad);
  return Buffer.from(value, 'base64');
}

export function encryptId(id: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'utf8'),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(id, 'utf8'),
    cipher.final(),
  ]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptId(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'utf8'),
    iv
  );

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function encryptIdForUrl(id: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'utf8'),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(id, 'utf8'),
    cipher.final(),
  ]);

  const payload = Buffer.concat([iv, encrypted]);
  return base64UrlEncode(payload);
}

export function decryptIdFromUrl(urlSafeValue: string): string {
  const payload = base64UrlDecode(urlSafeValue);

  const iv = payload.subarray(0, IV_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH);

  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'utf8'),
    iv
  );

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
