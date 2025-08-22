
'use client';

import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export default function AppleLoginButton() {

  const handleLogin = () => {
    // This MUST exactly match the URI registered in the Apple Developer portal.
    const redirectURI = 'https://scaneats-api.azurewebsites.net/api/auth/apple/callback';
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

    if (!clientId) {
      console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined in environment variables.");
      // Optionally show a toast to the user
      return;
    }

    // This URL initiates the web-based Apple Sign-In flow.
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectURI,
      response_type: 'code id_token',
      scope: 'name email',
      response_mode: 'form_post',
      state: 'STATE', // A unique value to prevent CSRF attacks
    }).toString()}`;

    // Redirect the user to Apple's authentication page.
    window.location.href = appleAuthUrl;
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogin}
      className="h-[40px] w-full max-w-[320px] bg-black text-white hover:bg-zinc-800 hover:text-white border-black"
    >
      <FaApple className="mr-2 h-5 w-5" />
      Sign in with Apple
    </Button>
  );
}
