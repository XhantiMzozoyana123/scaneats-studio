
'use client';

import {
  useState,
  useMemo,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import { Button } from '@/app/shared/components/ui/button';
import { Input } from '@/app/shared/components/ui/input';
import { Label } from '@/app/shared/components/ui/label';
import { Textarea } from '@/app/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/shared/components/ui/popover';
import { Calendar } from '@/app/shared/components/ui/calendar';
import { Skeleton } from '@/app/shared/components/ui/skeleton';

import {
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';

import { useToast } from '@/app/shared/hooks/use-toast';
import { useUserData } from '@/app/shared/context/user-data-context';
import { cn } from '@/app/shared/lib/utils';

export const ProfileView = () => {
  const { profile, initialProfile, setProfile, isLoading, saveProfile } =
    useUserData();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const isDirty = useMemo(() => {
    if (!profile || !initialProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(initialProfile);
  }, [profile, initialProfile]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    if (!profile) return;
    setProfile({ ...profile, gender: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && profile) {
      setProfile({ ...profile, birthDate: date });
    }
    setIsDatePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    const success = await saveProfile(profile);
    if (success) {
      toast({
        title: 'Profile Saved!',
        description: 'Your profile has been updated.',
      });
    }
    setIsSaving(false);
  };
  
  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-black pb-40 pt-5">
        <div className="w-[90%] max-w-[600px] rounded-lg bg-[rgba(14,1,15,0.32)] p-5">
          <div className="mb-8 flex justify-center">
            <Skeleton className="h-[140px] w-[140px] rounded-full" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
            <div className="pt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black pb-40 pt-5">
      <div className="w-[90%] max-w-[600px] rounded-lg bg-[rgba(14,1_5,0.32)] p-5">
        <div className="mb-8 flex justify-center">
          <Image
            src="https://gallery.scaneats.app/images/Personal%20Pic.png"
            alt="Profile & Personal Goals"
            width={140}
            height={140}
            className="max-h-[140px] w-auto max-w-full"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <Label
              htmlFor="name"
              className="mb-1.5 block font-bold transition-all hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
            >
              Name
            </Label>
            <Input
              id="name"
              value={profile.name}
              onChange={handleInputChange}
              placeholder="Your Name"
              className="w-full rounded-full border-2 border-[#555] bg-black px-4 py-3 text-base"
            />
          </div>

          <div className="form-group">
            <Label
              htmlFor="gender"
              className="mb-1.5 block font-bold transition-all hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
            >
              Gender
            </Label>
            <Select value={profile.gender} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full rounded-full border-2 border-[#555] bg-black px-4 py-3 text-base">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="form-group">
            <Label
              htmlFor="weight"
              className="mb-1.5 block font-bold transition-all hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
            >
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              value={profile.weight}
              onChange={handleInputChange}
              placeholder="e.g., 70"
              className="w-full rounded-full border-2 border-[#555] bg-black px-4 py-3 text-base"
            />
          </div>

          <div className="form-group">
            <Label
              htmlFor="birthDate"
              className="mb-1.5 block font-bold transition-all hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
            >
              Birth Date
            </Label>
            <Popover
              open={isDatePickerOpen}
              onOpenChange={setIsDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start rounded-full border-2 border-[#555] bg-black px-4 py-3 text-left text-base font-normal hover:bg-black/80',
                    !profile.birthDate && 'text-gray-400'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {profile.birthDate ? (
                    format(new Date(profile.birthDate), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={profile.birthDate ? new Date(profile.birthDate) : undefined}
                  onSelect={handleDateChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="form-group">
            <Label
              htmlFor="goals"
              className="mb-1.5 block font-bold transition-all hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
            >
              Body Goal
            </Label>
            <Textarea
              id="goals"
              value={profile.goals}
              onChange={handleInputChange}
              placeholder="e.g., Lose 5kg, build muscle, improve cardiovascular health..."
              className="min-h-[100px] w-full rounded-3xl border-2 border-[#555] bg-black px-4 py-3 text-base"
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={!isDirty || isSaving}
              className="w-full rounded-lg bg-[#7F00FF] py-3 text-lg font-bold text-white transition-all hover:bg-[#9300FF] hover:shadow-[0_0_12px_6px_rgba(127,0,255,0.8)] disabled:opacity-50"
              style={{
                boxShadow: '0 0 8px 2px rgba(127, 0, 255, 0.6)',
              }}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
