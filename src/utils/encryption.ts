/**
 * AES-256-GCM encryption for sensitive values stored in the database.
 * Requires ENCRYPTION_KEY env var (32 bytes hex = 64 hex chars).
 *
 * To generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12    // 96-bit IV for GCM
const TAG_LENGTH = 16   // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes).')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts a plain-text string.
 * Returns a base64 string in the format: <iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

/**
 * Decrypts an encrypted value produced by encrypt().
 * Returns the original plain-text string.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivHex, tagHex, encHex] = ciphertext.split(':')

  if (!ivHex || !tagHex || !encHex) {
    throw new Error('Invalid encrypted value format.')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

/**
 * Returns true if a string looks like an encrypted value (iv:tag:ciphertext format).
 * Used to avoid double-encrypting a value that is already encrypted.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2
}
