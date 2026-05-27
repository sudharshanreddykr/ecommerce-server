import jwt from 'jsonwebtoken';
import { KeyGenerator } from './keyGenerator';
import { logger } from './logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private static keys = KeyGenerator.getKeys();

  /**
   * Generate access token (short-lived, 15 minutes)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.keys.privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m',
    });
  }

  /**
   * Generate refresh token (long-lived, 7 days)
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload, type: 'refresh' }, this.keys.privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d',
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.keys.publicKey, {
        algorithms: ['RS256'],
      }) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired. Please refresh.');
      }
      throw new Error('Invalid access token.');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.keys.publicKey, {
        algorithms: ['RS256'],
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type.');
      }

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired. Please login again.');
      }
      throw new Error('Invalid refresh token.');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string): TokenPair {
    const payload = this.verifyRefreshToken(refreshToken);
    return this.generateTokenPair(payload);
  }
}

export default TokenService;
