import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import prisma from '@/lib/prisma';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getUid } from '@/lib/auth';
import "./globals.css";
import 'reactflow/dist/style.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fraym",
  description: "Your creative whiteboard",
};

async function getThemeColor() {
  try {
    const uid = await getUid();
    if (!uid) return undefined;

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { preferences: true },
    });
    
    // @ts-expect-error preferences is Json
    return user?.preferences?.themeColor as string | undefined;
  } catch {
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeColor = await getThemeColor();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider color={themeColor}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
