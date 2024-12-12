import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import styles from './layout.module.css';
import Image from 'next/image';
import RoomInfo from './jouer/[room]/roomInfo';


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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
      <div id={styles.contentContainer}>
            <header className={styles.roundedContainer}>
                <Image id={styles.logo} src="/logo.png" alt="StudioQuiz" width={137} height={106} />
                <nav>
                    <a href="/jouer"><span>Jouer</span></a>
                    <a href="/creer"><span>Créer une partie</span></a>
                </nav>
                <div id={styles.infos}>
                    <RoomInfo />
                </div>
            </header>
            <main className={styles.roundedContainer}>
                <div id={styles.tv}>
                    <div>
                    {children}
                    </div>
                </div>
            </main>
        </div>
      </body>
    </html>
  );
}
