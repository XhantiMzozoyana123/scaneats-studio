
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export default function AppleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);

    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectURI = 'https://api.scaneats.app/api/auth/apple/callback';

    if (!clientId) {
      console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined in environment variables.");
      setIsLoading(false);
      return;
    }

    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectURI,
      response_type: 'code id_token',
      scope: 'name email',
      response_mode: 'form_post',
      state: 'STATE', 
    }).toString()}`;

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
