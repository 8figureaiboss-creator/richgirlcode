import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", style: ["normal", "italic"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

const siteUrl = "https://www.holisticinnovationsllc.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Holistic Innovations LLC | Postpartum Doula & Newborn Care, Sacramento & Bay Area",
    template: "%s | Holistic Innovations LLC",
  },
  description:
    "Holistic wellness for women. Overnight newborn care, postpartum recovery support, lactation counseling, live-in and rotational care, and doula mentorship with Jamie Madeline Wilson in Sacramento and the San Francisco Bay Area.",
  keywords: [
    "postpartum doula Sacramento", "night nurse Bay Area", "newborn care specialist", "overnight newborn care",
    "certified lactation counselor", "postpartum support", "twins newborn care", "doula mentorship", "fourth trimester",
  ],
  openGraph: {
    title: "Holistic Innovations LLC | Holistic Wellness for Women",
    description: "Compassionate postpartum, newborn and lactation care across Sacramento and the San Francisco Bay Area.",
    url: siteUrl, siteName: "Holistic Innovations LLC", locale: "en_US", type: "website",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#168e91" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Holistic Innovations LLC",
  slogan: "Holistic Wellness for Women",
  url: siteUrl,
  foundingDate: "2020",
  founder: { "@type": "Person", name: "Jamie Madeline Wilson", jobTitle: "Postpartum Doula, Newborn Care Specialist & Certified Lactation Counselor" },
  areaServed: ["Sacramento, CA", "San Francisco Bay Area, CA"],
  sameAs: ["https://www.instagram.com/doulajamie_/"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
