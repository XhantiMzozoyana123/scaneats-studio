
'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        AppleID: any;
    }
}

export default function AppleLoginButton() {
  useEffect(() => {
    // This effect runs once on component mount to initialize the AppleID SDK.
    // It configures the essential parameters for the sign-in process.
    if (typeof window !== 'undefined' && window.AppleID) {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        scope: 'name email',
        redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!,
        state: 'scaneats-auth-state', // A unique string to prevent CSRF attacks
        usePopup: false, // Use false for a full page redirect, which is more reliable.
      });
    }

    // We only want this to run once, so we pass an empty dependency array.
  }, []);

  // This div is a placeholder that the Apple JS SDK will replace with the
  // official "Sign in with Apple" button. The attributes control its appearance.
  return (
    <div
      id="appleid-signin"
      data-color="black"
      data-border="true"
      data-type="sign-in"
      className="w-full max-w-[320px] [&>iframe]:!w-full" // Ensure the button is responsive
    ></div>
  );
}
