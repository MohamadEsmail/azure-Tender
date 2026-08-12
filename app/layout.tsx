import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة أزور الإبداعية | Azure Creative Platform",
  description:
    "منصة داخلية لتحويل بريف العميل إلى مفهوم فعالية متكامل وعرض تقديمي معتمد.",
};

/**
 * Root layout. The entire product is Arabic-first and rendered right-to-left,
 * so `dir="rtl"` and `lang="ar"` live at the top of the tree. English is the
 * secondary language and is handled per-component, not by flipping direction.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
