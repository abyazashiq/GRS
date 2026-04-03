import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GRS | Grievance Redressal System",
  description: "Institutional grievance redressal platform with assignment, escalation, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {/* Elite Background Physics */}
        <div className="blob w-[500px] h-[500px] top-[-100px] right-[-100px] animate-blob-one" />
        <div className="blob w-[600px] h-[600px] bottom-[-150px] left-[-150px] animate-blob-two opacity-60" />
        <div className="blob w-[300px] h-[300px] top-[40%] left-[20%] animate-blob-one opacity-30" style={{ animationDelay: '5s' }} />
        
        {/* Main Content */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
