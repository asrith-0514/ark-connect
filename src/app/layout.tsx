import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#07090D" },
  ],
};

export const metadata: Metadata = {
  title: "ARK Connect & Backoffice | Wholesale, Connected.",
  description: "Premium Industrial-Tech B2B Garment Distribution Platform: Matrix Bulk Ordering, Invoicing, Receivables and CRM.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARK Connect",
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
      suppressHydrationWarning
      className={`h-full antialiased overflow-x-hidden ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}else if(t==="system"){var m=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",m?"dark":"light");}else{document.documentElement.setAttribute("data-theme","light");}}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'){navigator.serviceWorker.getRegistrations().then(function(regs){for(var r of regs){r.unregister();}});if('caches' in window){caches.keys().then(function(names){for(var n of names){caches.delete(n);}});}}else if(window.location.protocol==='https:'){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-ink overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
