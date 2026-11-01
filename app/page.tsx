import { HomeLanding } from "@/features/home/HomeLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqItems } from "@/data/faq";
import { organizationJsonLd, websiteJsonLd, faqJsonLd } from "@/lib/seo/json-ld";

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), faqJsonLd(faqItems.slice(0, 6))]} />
      <HomeLanding />
    </>
  );
}
