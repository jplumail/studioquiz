import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import localFont from "next/font/local";
import "./globals.css";
import styles from './layout.module.css';

import Nav from './components/nav';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "StudioQuiz",
  description: "Un jeu de culture générale",
};

export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div id={styles.contentContainer}>
          <Nav />
          <main className={styles.roundedContainer}>
            <div id={styles.tv}>
              <div>
                {children}
              </div>
            </div>
          </main>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
