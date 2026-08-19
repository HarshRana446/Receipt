import { AlertProvider } from "@/components/alert-provider";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MORYA GROUP — Digital donation receipts",
  description:
    "Create, save, edit, and share MORYA GROUP donation receipts in seconds.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "white",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "black",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Splash loader – hidden after 1000–1200 ms via inline script */}
        <div id="ganesh-loader" className="ganesh-loader">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-16%20at%207.17.43%20PM-4XxX7fKWMzPhks0uj7hRUfdmZSLuFy.jpeg"
            alt="Morya Group"
          />
          <p>MORYA GROUP</p>
          <strong>LOADING…</strong>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=Math.floor(Math.random()*201)+1000;setTimeout(function(){var el=document.getElementById('ganesh-loader');if(el)el.setAttribute('data-hidden','true');},d);})();`,
          }}
        />

        <AlertProvider>{children}</AlertProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
