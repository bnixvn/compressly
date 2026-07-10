import type { Metadata } from "next";
import "./globals.css";
import { UiProvider } from "@/components/Providers";
import { readSettings } from "@/lib/settings";

const FALLBACK = {
  name: "Compressly",
  title: "Compressly — Image compression & WebP conversion",
  description:
    "Compress JPEG/PNG and convert to WebP online. Includes a REST API for WordPress plugins.",
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await readSettings();
    const lang = s.defaultLang || "en";
    const siteName = s.siteName?.[lang]?.trim() || s.siteName?.en?.trim() || FALLBACK.name;
    const title = s.seoTitle?.[lang]?.trim() || siteName;
    const description = s.seoDescription?.[lang]?.trim() || FALLBACK.description;
    return {
      title,
      description,
      applicationName: siteName,
      openGraph: {
        title,
        description,
        siteName,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    };
  } catch {
    return { title: FALLBACK.title, description: FALLBACK.description };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialTheme: "light" | "dark" = "dark";
  let initialLang: "en" | "vi" = "en";
  let faviconUrl: string | null = null;
  try {
    const s = await readSettings();
    initialTheme = s.defaultTheme;
    initialLang = s.defaultLang;
    faviconUrl = s.faviconUrl;
  } catch {
    // fall back to defaults
  }

  return (
    <html lang={initialLang} data-theme={initialTheme}>
      <head>
        {faviconUrl ? (
          <link rel="icon" href={faviconUrl} />
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
      </head>
      <body>
        <UiProvider initialTheme={initialTheme} initialLang={initialLang}>
          {children}
        </UiProvider>
      </body>
    </html>
  );
}
