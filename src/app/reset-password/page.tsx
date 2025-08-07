
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthBackgroundImage } from '@/app/shared/components/auth-background-image';
import { KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        if (!searchParams) {
            return;
        }

        const tokenParam = searchParams.get('token');
        const idParam = searchParams.get('id');

        if (!tokenParam || !idParam) {
            toast({
                variant: 'destructive',
                title: 'Invalid Link',
                description: 'The password reset link is invalid or has expired.',
            });
            router.push('/login');
        } else {
            setToken(tokenParam.replace(/ /g, '+'));
            setId(idParam);
        }
    }, [searchParams, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please ensure both passwords are the same.',
            });
            return;
        }

        if (!token || !id) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Missing required information to reset password.',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/Auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Id: id,
                    Token: token,
                    NewPassword: password,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Password Reset Successful',
                    description: 'You can now log in with your new password.',
                });
                router.push('/login');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to reset password.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !id) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>;
    }

    return (
        <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-black/60 p-8 backdrop-blur-lg">
            <div className="mb-8 text-left">
                <h2 className="font-headline text-4xl font-bold leading-tight">
                    Reset Your Password
                </h2>
                <p className="mt-2 text-white/70">
                    Enter your new password below.
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="relative border-b border-white/40">
                    <KeyRound className="absolute left-0 top-3 h-5 w-5 text-white/70" />
                    <Input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                 <div className="relative border-b border-white/40">
                    <KeyRound className="absolute left-0 top-3 h-5 w-5 text-white/70" />
                    <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                
                <div className="pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-stone-900 py-6 text-base font-semibold hover:bg-stone-800">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                    </Button>
                </div>
            </form>

             <p className="mt-8 text-center text-sm text-white/70">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-white hover:underline">
                    Log In
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center p-4">
            <AuthBackgroundImage />
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-white" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
