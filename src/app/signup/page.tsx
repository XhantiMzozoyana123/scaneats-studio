
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthBackgroundImage } from '@/app/shared/components/auth-background-image';
import { User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';

declare global {
    interface Window {
        AppleID: any;
    }
}

const AppleIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.001 16.568C11.025 16.568 9.947 16.248 8.994 15.65C8.01 15.04 7.23 14.15 6.84 13.128C5.604 10.057 6.81 6.558 9.21 4.72C10.27 3.912 11.58 3.5 12.825 3.5C13.161 3.501 14.956 3.57 16.128 4.632C16.173 4.671 16.215 4.715 16.254 4.764C16.293 4.715 16.335 4.671 16.38 4.632C17.552 3.57 19.347 3.501 19.683 3.5C20.928 3.5 22.238 3.912 23.298 4.72C24.088 5.378 24.639 6.242 24.908 7.2C24.819 7.245 24.731 7.288 24.645 7.33C22.758 8.412 21.804 10.592 22.254 12.69C22.99 15.893 25.532 17.5 26.5 17.78C26.476 17.832 26.452 17.885 26.427 17.937C25.414 20.985 23.082 23.518 20.016 23.94C18.914 24.088 17.794 23.639 17.004 22.86C16.142 22.012 15.702 20.942 15.756 19.84C16.427 16.712 14.492 15.228 12.001 15.228" transform="translate(-4.512 -1.452)"/>
    </svg>
);


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

    if (typeof window.AppleID !== 'undefined' && appleClientId && appleRedirectUri) {
        window.AppleID.auth.init({
            clientId: appleClientId,
            scope: 'email name',
            redirectURI: appleRedirectUri,
            state: 'signup',
            usePopup: true
        });
    }
  }, []);

  const handleAppleLogin = async (idToken: string) => {
    if (!idToken) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Apple ID token is missing.' });
        return;
    }
    setIsLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/AppleAuth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            let errorMsg = 'Apple login failed.';
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = errorData.error;
            } catch {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data.token || !data.user || !data.user.id || !data.user.email) {
            throw new Error('Invalid response received from server.');
        }

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);

        toast({ title: 'Login Successful!', description: 'Welcome to ScanEats.' });
        router.push('/dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const triggerAppleSignIn = async () => {
    try {
        const data = await window.AppleID.auth.signIn();
        if (data.authorization && data.authorization.id_token) {
            handleAppleLogin(data.authorization.id_token);
        }
    } catch (error) {
        console.error('Apple Sign-In error:', error);
        toast({ variant: 'destructive', title: 'Sign Up Failed', description: 'Could not complete Sign In with Apple.' });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/googleauth/onetap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        
        toast({
          title: 'Login Successful!',
          description: 'Welcome to ScanEats.',
        });
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google One Tap login failed.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: 'Google authentication failed. Please try again.',
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Registration successful. Please log in.',
        });
        router.push('/login');
      } else {
        let errorMessage = 'An unknown error occurred during registration.';
        if (response.status >= 500) {
          errorMessage = 'Our servers are currently unavailable. Please try again later.';
        } else {
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // Keep the generic message
            }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuthBackgroundImage />
      <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-black/60 p-8 backdrop-blur-lg">
        <div className="mb-8 text-left">
          <h1 className="font-headline text-4xl font-bold leading-tight">
            Create your
            <br />
            account
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative border-b border-white/40">
            <User className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative border-b border-white/40">
            <Mail className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative border-b border-white/40">
            <KeyRound className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="terms"
              required
              className="border-primary data-[state=checked]:bg-primary"
            />
            <Label htmlFor="terms" className="text-sm text-white/70">
              I agree to the{' '}
              <Link
                href="/privacy-policy"
                className="font-semibold text-white underline hover:no-underline"
              >
                Terms & Conditions
              </Link>
            </Label>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-stone-900 py-6 text-base font-semibold hover:bg-stone-800"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/60 px-2 text-white/70">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-2">
            <div className="w-full max-w-[320px]">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    width="320px"
                />
            </div>
            <Button onClick={triggerAppleSignIn} disabled={isLoading} variant="outline" className="w-full max-w-[320px] bg-white text-black hover:bg-gray-200">
                <AppleIcon /> Continue with Apple
            </Button>
        </div>

        <p className="mt-8 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
