import { Response, Request } from 'express';
import { authService } from '../services/authService';
import { TokenService } from '../utils/tokenService';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true',
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, COOKIE_OPTIONS);
  }

  async redirectGoogle(req: Request, res: Response) {
    try {
      const url = authService.getGoogleAuthUrl();
      res.redirect(url);
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new AppError('Google authorization code is missing', 400);
      }

      const user = await authService.exchangeGoogleCode(code);
      const tokens = TokenService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      this.setRefreshTokenCookie(res, tokens.refreshToken);
      res.redirect(authService.getFrontendRedirectUrl(tokens.accessToken));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(authService.getFrontendRedirectUrl('', errorMessage));
    }
  }

  async redirectGithub(req: Request, res: Response) {
    try {
      const url = authService.getGithubAuthUrl();
      res.redirect(url);
    } catch (error) {
      throw error;
    }
  }

  async handleGithubCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new AppError('GitHub authorization code is missing', 400);
      }

      const user = await authService.exchangeGithubCode(code);
      const tokens = TokenService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      this.setRefreshTokenCookie(res, tokens.refreshToken);
      res.redirect(authService.getFrontendRedirectUrl(tokens.accessToken));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(authService.getFrontendRedirectUrl('', errorMessage));
    }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response) {
    try {
      // Try to get token from cookie first, then fallback to body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const tokens = TokenService.refreshAccessToken(refreshToken);

      // Update the cookie with the new refresh token
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      res.json({
        status: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      throw new AppError(message, 401);
    }
  }

  async logout(req: Request, res: Response) {
    const { maxAge, ...cookieOptionsWithoutMaxAge } = COOKIE_OPTIONS;
    res.clearCookie('refreshToken', cookieOptionsWithoutMaxAge);
    res.json({
      status: true,
      message: 'Logged out successfully',
    });
  }
}

export const authController = new AuthController();
