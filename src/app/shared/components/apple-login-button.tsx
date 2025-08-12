
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/app/shared/lib/api';

export default function AppleLoginButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await SignInWithApple.authorize();

      const { identityToken } = result.response;
      if (!identityToken) {
        throw new Error('Apple Sign-In failed: No identity token received.');
      }

      // Send the identityToken to your backend for verification
      const backendResponse = await fetch(`${API_BASE_URL}/api/Auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: identityToken }),
      });

      if (!backendResponse.ok) {
        let errorMsg = 'Apple sign-in failed on the server.';
        try {
          const errorData = await backendResponse.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await backendResponse.json();
      if (!data.token || !data.user || !data.user.id || !data.user.email) {
        throw new Error('Invalid response received from server.');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);

      toast({ title: 'Login Successful!', description: 'Welcome back.' });
      router.push('/dashboard');

    } catch (error: any) {
      // Handle cases where the user cancels the sign-in prompt
      if (error.message && error.message.includes('canceled by user')) {
        console.log('Apple Sign-In canceled by user.');
      } else {
        toast({
          variant: 'destructive',
          title: 'Apple Sign-In Failed',
          description: error.message || 'An unknown error occurred.',
        });
      }
    } finally {
      setIsLoading(false);
    }
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
