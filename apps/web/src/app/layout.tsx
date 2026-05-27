import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "../components/providers/auth-provider";

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="font-sans bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}