import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const KEYS_DIR = path.join(process.cwd(), 'keys');

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export class KeyGenerator {
  /**
   * Generate RSA key pair for JWT signing
   * Public key: verify tokens, Private key: sign tokens
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey: publicKey as string,
      privateKey: privateKey as string,
    };
  }

  /**
   * Save key pair to files
   */
  static saveKeyPair(keyPair: KeyPair): void {
    // Create keys directory if it doesn't exist
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    const publicKeyPath = path.join(KEYS_DIR, 'public.pem');
    const privateKeyPath = path.join(KEYS_DIR, 'private.pem');

    fs.writeFileSync(publicKeyPath, keyPair.publicKey, 'utf8');
    fs.writeFileSync(privateKeyPath, keyPair.privateKey, 'utf8');
    fs.chmodSync(privateKeyPath, 0o600); // Restrict private key permissions

    logger.info('✓ RSA key pair generated and saved to ./keys/');
  }

  /**
   * Load key pair from files
   */
  static loadKeyPair(): KeyPair {
    const publicKeyPath = path.join(KEYS_DIR, 'public.pem');
    const privateKeyPath = path.join(KEYS_DIR, 'private.pem');

    if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
      logger.warn('Keys not found. Generating new key pair...');
      const keyPair = this.generateKeyPair();
      this.saveKeyPair(keyPair);
      return keyPair;
    }

    return {
      publicKey: fs.readFileSync(publicKeyPath, 'utf8'),
      privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
    };
  }

  /**
   * Get or initialize keys
   */
  static getKeys(): KeyPair {
    return this.loadKeyPair();
  }
}

export default KeyGenerator;
