
'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        AppleID: any;
    }
}

export default function AppleLoginButton() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AppleID) {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        scope: 'name email',
        redirectURI: `${window.location.origin}/apple-redirect`,
        state: 'scaneats-auth-state', 
        usePopup: false,
      });
    }
  }, []);

  return (
    <div
      id="appleid-signin"
      data-color="black"
      data-border="true"
      data-type="sign-in"
      className="apple-login-button h-[40px] w-full max-w-[320px] [&>iframe]:!h-full [&>iframe]:!w-full"
    ></div>
  );
}
