import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Nairobi | Kenya's Premium Business & Property Directory",
  description: "Discover the best businesses, real estate, and 360° virtual tours in Nairobi, Kiambu, and Machakos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Keep Pannellum for your 360° tours */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
        />
        <script
          type="text/javascript"
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
          async
        ></script>
      </head>
      <body className={`${jakarta.className} antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}