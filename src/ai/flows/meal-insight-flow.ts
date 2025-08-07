'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/shared/hooks/use-toast';
import { useUserData } from '@/app/shared/context/user-data-context';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  Repeat,
  Trash2,
  UserCircle,
  XCircle,
  CircleDollarSign,
  Wallet,
} from 'lucide-react';
import { API_BASE_URL } from '@/app/shared/lib/api';

const SettingsItem = ({
  icon: Icon,
  label,
  value,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number;
  href?: string;
  onClick?: () => void;
}) => {
  const content = (
    <div
      onClick={onClick}
      className={`flex items-center p-4 transition-colors rounded-lg ${
        href || onClick ? 'cursor-pointer hover:bg-zinc-800' : ''
      }`}
    >
      <Icon className="mr-4 h-5 w-5 text-gray-300" />
      <span className="flex-1 font-medium text-white">{label}</span>
       {value !== undefined && (
        <span className="text-gray-400 mr-2 font-medium">{value}</span>
      )}
      {(href || onClick) && <ChevronRight className="h-5 w-5 text-gray-500" />}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

const DestructiveSettingsItem = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex cursor-pointer items-center p-4 transition-colors rounded-lg hover:bg-red-900/50"
  >
    <Icon className="mr-4 h-5 w-5 text-red-400" />
    <span className="flex-1 font-medium text-red-400">{label}</span>
  </div>
);

export const SettingsView = ({
  onNavigateToProfile,
}: {
  onNavigateToProfile: () => void;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, isLoading, fetchProfile } =
    useUserData();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You are not logged in.',
      });
      setIsCancelling(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
      });

      if (response.ok) {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription has been successfully cancelled.',
        });
        await fetchProfile(); // Refresh user data
      } else {
        let errorMessage = 'Failed to cancel subscription.';
        if (response.status === 401) {
            errorMessage = 'Authentication error. Please log in again.';
        } else if (response.status === 400) {
          errorMessage = 'No active subscription found to cancel.';
        } else if (response.status >= 500) {
          errorMessage =
            'Our servers are experiencing issues. Please try again later.';
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: error.message,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You are not logged in.',
      });
      setIsDeleting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted.',
        });
        handleLogout();
      } else {
        let errorMessage = 'Failed to delete account.';
        if (response.status === 401 || response.status === 403) {
           errorMessage = 'Authentication error. Please log in again.';
        } else if (response.status >= 500) {
          errorMessage =
            'Our servers are experiencing issues. Please try again later.';
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
      });
      return;
    }
    setIsChangingPassword(true);

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Could not verify user information. Please log in again.',
      });
      setIsChangingPassword(false);
      return;
    }

    const payload = {
      currentPassword: currentPassword,
      newPassword: newPassword,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been updated successfully.',
        });
        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        let errorMessage = 'Failed to change password.';
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (response.status === 400) {
          errorMessage = 'The current password you entered is incorrect.';
        } else if (response.status >= 500) {
          errorMessage =
            'Our servers are experiencing issues. Please try again later.';
        } else {
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Keep generic message
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950 text-gray-200">
        <main className="w-full max-w-2xl flex-1 self-center p-6">
          <div className="space-y-8">
            <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
              <Skeleton className="h-7 w-32 rounded-md" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isSubscribed = profile?.isSubscribed ?? false;

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-gray-200">
      <header className="sticky top-0 z-10 w-full bg-zinc-900/50 p-4 shadow-md backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-center">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>
      <main className="w-full max-w-2xl mx-auto p-6 pb-28">
        <div className="space-y-8">
          <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Account</h2>
            <SettingsItem
              icon={UserCircle}
              label="Profile & Personal Goals"
              onClick={onNavigateToProfile}
            />
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <button className="w-full">
                  <SettingsItem icon={Lock} label="Change Password" onClick={() => {}} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </form>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Billing</h2>
             <SettingsItem
              icon={Wallet}
              label="Your Credits"
              value={profile?.credits ?? 0}
            />
             <SettingsItem
              icon={CircleDollarSign}
              label="Buy Credits"
              href="/credits"
            />
            {isSubscribed ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <button className="w-full">
                        <DestructiveSettingsItem
                          icon={XCircle}
                          label="Cancel Subscription"
                          onClick={() => {}}
                        />
                      </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel your subscription at the end of the current billing period. You will lose access to premium features, but your data will be saved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        className={buttonVariants({ variant: 'destructive' })}
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                      >
                        {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            ) : (
                <SettingsItem
                  icon={Repeat}
                  label="Manage Subscription"
                  href="/pricing"
                />
            )}
          </div>

          <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Actions</h2>
            <SettingsItem icon={LogOut} label="Log Out" onClick={handleLogout} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full">
                  <DestructiveSettingsItem
                    icon={Trash2}
                    label="Delete Account"
                    onClick={() => {}}
                  />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: 'destructive' })}
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{' '}
                    Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
};