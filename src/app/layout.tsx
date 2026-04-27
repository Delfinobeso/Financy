import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { BudgetProvider } from "@/lib/context";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Financy",
  description: "Gestisci il tuo budget personale",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Financy",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('financy-theme')||(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <BudgetProvider>{children}</BudgetProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
