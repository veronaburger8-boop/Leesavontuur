/** Structured data for search engines (schema.org), as JSON-LD. "<" is escaped so the text can't end the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leesavontuur.co.za").replace(/\/$/, "");

export const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Leesavontuur",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon.svg`,
  email: "leesavontuur194@gmail.com",
  areaServed: "ZA",
};
