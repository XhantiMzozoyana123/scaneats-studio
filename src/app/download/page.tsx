
'use client';

import Image from 'next/image';
import { AuthBackgroundImage } from '@/app/shared/components/auth-background-image';
import { InstallationGuide } from '@/app/shared/components/installation-guide';

export default function DownloadPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuthBackgroundImage />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-black/60 p-6 shadow-2xl backdrop-blur-lg sm:p-8">
        <Image
          src="/images/ScanEatsLogo.png"
          alt="ScanEats Logo"
          width={120}
          height={120}
          className="max-h-[120px] w-auto"
        />
        <h1 className="text-center font-headline text-3xl font-bold">
          Install ScanEats
        </h1>
        <p className="max-w-xs text-center text-sm text-white/80">
          Follow the instructions for your device to add ScanEats to your home
          screen for the best experience.
        </p>

        <InstallationGuide />
      </div>
    </div>
  );
}
