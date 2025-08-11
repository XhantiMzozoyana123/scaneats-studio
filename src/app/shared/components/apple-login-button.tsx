
'use client';

import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';

export default function AppleLoginButton() {
  const handleLogin = () => {
    // This URL initiates the Apple Sign-In flow.
    // Apple will authenticate the user and then POST the result to the `redirect_uri`.
    // The backend at this URI is responsible for validating the response from Apple,
    // creating a session, and then redirecting the user back to the frontend app with a token.
    const appleSignInUrl =
      `https://appleid.apple.com/auth/authorize?response_type=code&client_id=com.scaneats1.app&redirect_uri=https://api.scaneats.app/api/Auth/apple-signin-callback&scope=name%20email&response_mode=form_post`;

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
