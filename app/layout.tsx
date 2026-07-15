import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard MAN 1 Lampung Selatan | EMIS & SIMPEG",
  description:
    "Dashboard profil sekolah dan siswa dari EMIS serta profil dan statistik ASN dari SIMPEG MAN 1 Lampung Selatan.",
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
