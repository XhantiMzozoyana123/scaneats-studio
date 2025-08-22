import type { Metadata, Viewport } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PT_Sans, Playfair_Display } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScanEats: Your AI Nutritionist',
  description:
    'Scan your food and get personalized nutrition advice with our AI-powered app.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1D122F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error(
      'FATAL: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined in environment variables. Google Authentication cannot work without it.'
    );
  }

  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA and Universal Icons */}
        <link
          rel="icon"
          href="/images/ScanEatsLogo.png"
          type="image/png"
        />

        {/* Apple Touch Icon (iOS Homescreen) & Fullscreen settings */}
        <link
          rel="apple-touch-icon"
          href="/images/ScanEatsLogo.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="ScanEats" />

        {/* Theme Color for Browser UI */}
        <meta name="theme-color" content="#1D122F" />
      </head>
      <body
        className={`${ptSans.variable} ${playfairDisplay.variable} font-body antialiased`}
      >
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
          <Toaster />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
