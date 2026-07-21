import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard MAN 1 Lampung Selatan | Satu Data Madrasah",
  description:
    "Dashboard agregat MAN 1 Lampung Selatan dari database lokal, GIS Madrasah Kemenag, dan API website madrasah.",
  icons: {
    icon: [
      {
        url: "/brand/man1/logo.png",
        type: "image/png",
        sizes: "120x108",
      },
    ],
    apple: [
      {
        url: "/brand/man1/logo.png",
        type: "image/png",
        sizes: "120x108",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
