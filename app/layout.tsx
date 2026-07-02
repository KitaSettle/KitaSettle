import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getPublicEnv } from "@/lib/config/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "KitaSettle",
  description: "Every morning, know exactly what deserves your attention.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicEnv = getPublicEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__KITASETTLE_PUBLIC_ENV__=${JSON.stringify({
              appName: publicEnv.appName,
              appEnv: publicEnv.appEnv,
              appUrl: publicEnv.appUrl,
              supabaseUrl: publicEnv.supabaseUrl,
              supabaseAnonKey: publicEnv.supabaseAnonKey,
            })};`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kitasettle-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
