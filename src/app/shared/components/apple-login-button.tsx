
'use client';

import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';

export default function AppleLoginButton() {
  const handleLogin = () => {
    const appleSignInUrl =
      `https://appleid.apple.com/auth/authorize?response_type=code&client_id=com.scaneats1.app&redirect_uri=https://api.scaneats.app/api/auth/apple/callback&scope=name%20email&response_mode=form_post`;

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
