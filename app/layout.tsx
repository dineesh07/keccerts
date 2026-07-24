import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventsStoreProvider } from "@/lib/eventsStore";

export const metadata: Metadata = {
  title: "Certificate Portal | Kongu Engineering College (KEC)",
  description:
    "Search and download your contest certificates from Kongu Engineering College. Enter your roll number or name to get instant access to all your certificates.",
  keywords: ["KEC", "certificate", "Kongu Engineering College", "student portal", "contest", "participation"],
  authors: [{ name: "Kongu Engineering College" }],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Kongu Engineering College — Certificate Portal",
    description: "Find and download your KEC contest participation certificates instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EventsStoreProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navbar />
          {children}
          <Footer />
        </EventsStoreProvider>
      </body>
    </html>
  );
}

