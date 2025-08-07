
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { View } from '../dashboard.types';

export const HomeView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <video
          src="https://gallery.scaneats.app/images/ScanFoodNEW.webm"
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <header className="absolute top-1 left-1 z-10 h-10 w-24">
        <Image
          src="https://gallery.scaneats.app/images/ScanEatsLogo.png"
          alt="ScanEats Logo"
          fill
          style={{ objectFit: 'contain' }}
        />
      </header>

      <main className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 pb-28 pt-12 text-center text-white">
        <div className="space-y-4">
          <h1
            className="title-gradient font-headline text-5xl font-bold md:text-6xl"
            style={{
              textShadow:
                '0px 2px 2px rgba(0, 0, 0, 0.25), 0px 0px 10px rgba(190, 100, 255, 0.45)',
            }}
          >
            ScanEats
          </h1>
          <h2 className="font-body text-xl font-light text-gray-200 opacity-90 md:text-2xl">
            Your AI Nutritionist
          </h2>
          <p className="mx-auto max-w-md font-body text-base leading-relaxed text-gray-300 opacity-95 md:text-lg">
            Meet Sally, your personal assistant who’ll help you stay on track
            with your meals and let you know if you&apos;re eating well —
            without the need to constantly go for health foods.
          </p>
        </div>

        <Button
          onClick={() => onNavigate('scan')}
          className="mt-8 h-[199px] w-full max-w-[336px] rounded-3xl bg-primary/90 text-xl font-light uppercase tracking-[2px] text-white animate-breathe-glow transition-all hover:animate-none hover:shadow-[0_12px_70px_20px_rgba(140,30,255,0.8)] focus:scale-105"
        >
          Scan Food
        </Button>
      </main>
    </>
  );
};
