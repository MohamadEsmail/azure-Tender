import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام ملفات المناقصات",
  description: "نظام داخلي لإنتاج ملفات عروض المناقصات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Arabic-first, full RTL at the layout level per CLAUDE.md.
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
