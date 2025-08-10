'use client';

import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';

export default function AppleLoginButton() {
  const handleLogin = () => {
    // We pass the current URL as 'state' so the backend can redirect back here
    // after the Apple login is complete.
    const state = window.location.href;

    const appleSignInUrl =
      `https://appleid.apple.com/auth/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        response_mode: 'form_post',
        client_id: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        redirect_uri: 'https://api.scaneats.app/api/auth/callback/apple',
        scope: 'name email',
        state: state, // Pass the current page URL as state
      }).toString();

    window.location.href = appleSignInUrl;
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
