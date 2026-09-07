import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "PolyGuard AI · Mixed-medicine evidence",
  description:
    "Explore mixed-medicine interaction signals with transparent evidence paths. Educational prototype with clearly labeled demo data.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
