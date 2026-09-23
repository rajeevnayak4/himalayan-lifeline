import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import GlobalAlertListener from "@/components/ui/GlobalAlertListener";

export const metadata: Metadata = {
  title: "Jiban Dan — Mountain Emergency SOS & Mesh Rescue Network",
  description: "Crowd-sourced emergency SOS and simulated BLE mesh network for trekkers and responders in Nepal Himalayas (Khumbu, Everest, Annapurna).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <GlobalAlertListener />

        {/* Mountain Emergency Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-center md:text-left">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-slate-300">Nepal Mountain Rescue Directory:</span>
              <span className="text-slate-400">HRA Clinic (+977 1 4443999) | Nepal Army Air Wing (100) | Trail Radio: 144.300 MHz</span>
            </div>

          </div>
        </footer>

        {/* Client-side Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration skipped:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
