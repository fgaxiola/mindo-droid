import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AppLayout } from "@/components/layout";
import { getDictionary } from "@/lib/dictionaries";
import { DictionaryProvider } from "@/providers/dictionary-provider";
import { FocusModeProvider } from "@/providers/focus-mode-provider";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Focus App",
  description: "A productivity app with Pomodoro and Eisenhower Matrix",
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }];
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as "en" | "es");

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${interTight.variable} antialiased`}
      >
        <DictionaryProvider dictionary={dictionary}>
          <QueryProvider>
            <AuthProvider>
              <FocusModeProvider>
                <AppLayout>{children}</AppLayout>
              </FocusModeProvider>
            </AuthProvider>
          </QueryProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
