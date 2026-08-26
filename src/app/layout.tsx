import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cinemix — Learn English Through the Movies You Love",
  description:
    "Cinemix understands your English level, your goal, and your taste — then finds the movie that grows with you.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${unbounded.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-midnight text-porcelain font-ui overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
