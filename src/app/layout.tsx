import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../lib/theme-provider";

export const metadata: Metadata = {
  title: "KEA Talent Management System",
  description:
    "KEA Group talent, field workforce, outlet, and performance management.",
  icons: {
    icon: "/brand/kea-logo.jpg",
    apple: "/brand/kea-logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1730",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('kea_theme');
                  var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.body && document.body.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
