import { supabase } from '../supabase/client';

export const GOOGLE_OAUTH_CONFIG = {
  clientId: '790977864136-rou3lr2bdi9nvuqh137t4p6t263lch5t.apps.googleusercontent.com',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  scope: 'email profile openid',
};

/**
 * Initiates the Google OAuth flow using Supabase.
 * This handles constructing the URL and redirecting the user.
 */
export const loginWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_OAUTH_CONFIG.redirectUri,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
};

/**
 * Handles the Google OAuth callback.
 * Supabase automatically detects the session from the URL hash/query parameters.
 */
export const handleGoogleCallback = async () => {
  // Supabase automatically handles the code exchange or implicit flow 
  // when getSession is called after a redirect.
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error handling Google callback:', error);
    throw error;
  }
  
  return data.session;
};

/**
 * Manually constructs a Google Login URL (for reference or manual usage).
 * Note: Using Supabase's signInWithOAuth is preferred as it handles nonce and security states.
 */
export const buildGoogleLoginUrl = () => {
  const root = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scope,
    access_type: 'offline',
    include_granted_scopes: 'true',
  });
  
  return `${root}?${params.toString()}`;
};
