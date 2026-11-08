import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "NexusLens — FEW Nexus Scenario Modeling",
  description:
    "Blockchain-enhanced Food–Energy–Water nexus decision support with immutable provenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${space.variable} ${jetbrains.variable} min-h-screen font-sans antialiased`}
      >
        <Providers>
          <Navbar />
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
            <Sidebar />
            <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
