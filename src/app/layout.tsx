import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteName = "Garage AI";
const siteDescription =
  "Upload a photo of your car and let AI visualize your dream build—widebody kits, wheels, lowered suspension, spoilers, wraps and more—before you spend a cent on parts.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Garage AI — Visualize Your Dream Car Build with AI",
    template: "%s | Garage AI",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "car customization",
    "AI car builder",
    "virtual car tuning",
    "widebody kit preview",
    "car wrap visualizer",
    "modified cars",
    "wheel fitment",
    "car mod simulator",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  category: "automotive",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Garage AI — Visualize Your Dream Car Build with AI",
    description: siteDescription,
    images: [
      {
        url: "/assets/before-after-4.png",
        width: 1063,
        height: 794,
        alt: "A car transformed with AI-generated custom modifications",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Garage AI — Visualize Your Dream Car Build with AI",
    description: siteDescription,
    images: ["/assets/before-after-4.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
