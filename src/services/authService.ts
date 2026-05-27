import crypto from 'crypto';
import { AppError } from '../utils/errors';
import { userService } from './userService';
import User from '../models/User';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

export class AuthService {
  getGoogleAuthUrl(): string {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google client ID is not configured', 500);
    }

    const redirectUri = `${backendUrl}/api/v1/users/auth/google/callback`;
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  getGithubAuthUrl(): string {
    if (!process.env.GITHUB_CLIENT_ID) {
      throw new AppError('GitHub client ID is not configured', 500);
    }

    const redirectUri = `${backendUrl}/api/v1/users/auth/github/callback`;
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('allow_signup', 'true');
    return url.toString();
  }

  private async getGoogleUserFromCode(code: string) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new AppError('Google OAuth credentials are not configured', 500);
    }

    const redirectUri = `${backendUrl}/api/v1/users/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new AppError(`Google token exchange failed: ${text}`, 500);
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
      throw new AppError('Google did not return an ID token', 500);
    }

    const userInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      throw new AppError('Google account does not provide an email address', 400);
    }

    const nameParts = (userInfo.name || '').split(' ');
    return {
      email: userInfo.email,
      firstName: nameParts.shift() || 'Google',
      lastName: nameParts.join(' ') || 'User',
    };
  }

  private async getGithubUserFromCode(code: string) {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new AppError('GitHub OAuth credentials are not configured', 500);
    }

    const redirectUri = `${backendUrl}/api/v1/users/auth/github/callback`;
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new AppError('GitHub access token exchange failed', 500);
    }

    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const profile = await profileResponse.json();

    let email = profile.email as string;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailsResponse.json();
      const primary = Array.isArray(emails)
        ? emails.find((item: any) => item.primary && item.verified)
        : null;
      email = primary?.email || emails[0]?.email;
    }

    if (!email) {
      throw new AppError('GitHub account does not provide a public email address', 400);
    }

    const name = String(profile.name || profile.login || 'GitHub User');
    const nameParts = name.split(' ');
    return {
      email,
      firstName: nameParts.shift() || 'GitHub',
      lastName: nameParts.join(' ') || 'User',
    };
  }

  async findOrCreateSocialUser(payload: { email: string; firstName: string; lastName: string }) {
    let user = await userService.getUserByEmail(payload.email);
    if (user) {
      if (!user.isActive) {
        throw new AppError('User account is deactivated', 403);
      }
      return user;
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    user = await userService.createUser({
      email: payload.email,
      password: randomPassword,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    return user;
  }

  async exchangeGoogleCode(code: string) {
    const userData = await this.getGoogleUserFromCode(code);
    const user = await this.findOrCreateSocialUser(userData);
    return user;
  }

  async exchangeGithubCode(code: string) {
    const userData = await this.getGithubUserFromCode(code);
    const user = await this.findOrCreateSocialUser(userData);
    return user;
  }

  getFrontendRedirectUrl(token: string, error?: string) {
    const url = new URL(`${frontendUrl}/auth/callback`);
    url.searchParams.set('token', token);
    if (error) {
      url.searchParams.set('error', error);
    }
    return url.toString();
  }
}

export const authService = new AuthService();
