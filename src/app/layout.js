import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CreditsProvider } from "@/context/CreditsContext";
import { Toaster } from "react-hot-toast";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Splash AI Studio - Transform Your Creative Vision",
  description: "AI-powered creative studio for stunning visuals and project management",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            <CreditsProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#1e1c19",
                    color: "#f5f2eb",
                    border: "1px solid rgba(205, 150, 57, 0.12)",
                  },
                }}
              />
            </CreditsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
