
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

import { UserDataProvider } from '@/app/shared/context/user-data-context';

declare global {
    interface Window {
        deferredPrompt: any;
    }
}

interface DecodedToken {
  sub: string;
  email: string;
  jti: string;
}

function AuthHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!searchParams) {
      return;
    }
    const tokenFromUrl = searchParams.get('token');

    if (tokenFromUrl) {
      localStorage.setItem('authToken', tokenFromUrl);
      try {
        const decodedToken = jwtDecode<DecodedToken>(tokenFromUrl);
        localStorage.setItem('userId', decodedToken.sub);
        localStorage.setItem('userEmail', decodedToken.email);
      } catch (error) {
        console.error('Failed to decode token from URL', error);
      }
      // Clean the URL by removing the token
      router.replace('/dashboard');
      // Token found and set, user is verified.
      setIsVerifying(false); 
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/login');
    } else {
      setIsVerifying(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return <UserDataProvider>{children}</UserDataProvider>;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    }>
        <AuthHandler>{children}</AuthHandler>
    </Suspense>
  )
}
