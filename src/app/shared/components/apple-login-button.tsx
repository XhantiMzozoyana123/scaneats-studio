
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/app/shared/lib/api';

export default function AppleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);

    // This is for a web-based flow. The user will be redirected to Apple to sign in.
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID; // Your Apple Services ID

    // The backend endpoint that Apple will redirect to after successful authentication.
    // This URL MUST be registered as an authorized redirect URI in your Apple Developer account.
    const redirectURI = `https://api.scaneats.app/api/auth/apple/callback`;

    if (!clientId) {
      console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined in environment variables.");
      setIsLoading(false);
      return;
    }

    // Construct the Apple authentication URL
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectURI,
      response_type: 'code id_token', // Request authorization code and id token
      scope: 'name email', // Request user's name and email
      response_mode: 'form_post', // The response will be sent as a POST request
      state: 'STATE', // A random string for security, you can generate this dynamically
    }).toString()}`;

    // Redirect the user to Apple's authentication page
    window.location.href = appleAuthUrl;
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogin}
      disabled={isLoading}
      className="h-[40px] w-full max-w-[320px] bg-black text-white hover:bg-zinc-800 hover:text-white border-black"
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          <FaApple className="mr-2 h-5 w-5" />
          Sign in with Apple
        </>
      )}
    </Button>
  );
}
