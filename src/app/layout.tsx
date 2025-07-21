import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/mobile-responsive.css";
import { AuthProvider } from "@/providers/auth-provider";
import { Analytics, SpeedInsights } from "@/lib/analytics/vercel";
import { WebVitals } from "@/components/analytics/web-vitals";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { AccessibilityToggle, SkipToMain } from "@/components/ui/accessibility";
import { initializeSentry } from "@/lib/monitoring/sentry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Content Generator",
  description: "AI-powered SEO content generation platform",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SEO Generator',
  },
  formatDetection: {
    telephone: false,
  },
};

// Initialize Sentry
if (typeof window !== 'undefined') {
  initializeSentry();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased focus-visible keyboard-nav`}
      >
        <SkipToMain />
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <main id="main-content" role="main">
                {children}
              </main>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <AccessibilityToggle />
        <Analytics />
        <SpeedInsights />
        <WebVitals debug={process.env.NODE_ENV === 'development'} />
      </body>
    </html>
  );
}
