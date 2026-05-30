import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripFlow Architect | Strictly Typed Planner",
  description: "A premium, high-integrity dashboard showcasing strictly typed state management using Zustand, Immer, and Zod boundaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
