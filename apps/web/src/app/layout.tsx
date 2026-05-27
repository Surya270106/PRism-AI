import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css"; // Make sure this path matches your global CSS file!

export const metadata = {
  title: "PRism AI | Smart Reviews",
  description: "Automated PR reviews using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We inject the fonts at the absolute root HTML level
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="font-sans bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200">
        {children}
      </body>
    </html>
  );
}