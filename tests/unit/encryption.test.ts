/**
 * Encryption Service Tests
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateAccessKey } from '../../src/services/encryption.service.js';

describe('Encryption Service', () => {
  const TEST_DATA = 'Hello World';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(TEST_DATA);
    expect(encrypted).not.toBe(TEST_DATA);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(TEST_DATA);
  });

  it('should generate different ciphertexts for same plaintext', () => {
    const encrypted1 = encrypt(TEST_DATA);
    const encrypted2 = encrypt(TEST_DATA);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    expect(decrypt(encrypted1)).toBe(TEST_DATA);
    expect(decrypt(encrypted2)).toBe(TEST_DATA);
  });

  it('should throw error when decrypting invalid data', () => {
    expect(() => decrypt('invalid:data')).toThrow();
  });

  it('should generate valid access keys', () => {
    const key = generateAccessKey();
    expect(key).toMatch(/^[A-Z0-9]{3}:[A-Z0-9]{3}:[A-Z0-9]{3}$/);
    expect(key.length).toBe(11);
  });
});
