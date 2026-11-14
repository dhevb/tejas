import { notFound } from "next/navigation";
import { createMetadata, siteConfig } from "@/config/seo";
import { getOlympiadContent, getAllOlympiadSlugs } from "@/content/olympiads";
import { OlympiadPortal } from "@/components/olympiads/OlympiadPortal";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, courseJsonLd, faqJsonLd } from "@/lib/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllOlympiadSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const olympiad = getOlympiadContent(slug);
  if (!olympiad) return {};
  return createMetadata({
    title: `${olympiad.name.en} Olympiad`,
    description: `${olympiad.tagline.en} ${olympiad.description.en.slice(0, 120)}…`,
    path: `/olympiads/${slug}`,
  });
}

export default async function OlympiadDetailPage({ params }: Props) {
  const { slug } = await params;
  const olympiad = getOlympiadContent(slug);
  if (!olympiad) notFound();

  const url = `${siteConfig.url}/olympiads/${slug}`;
  const faqItems = olympiad.faqs.map((f) => ({ question: f.question.en, answer: f.answer.en }));

  return (
    <>
      <JsonLd
        data={[
          courseJsonLd({ name: `${olympiad.name.en} Olympiad`, description: olympiad.description.en, url }),
          breadcrumbJsonLd([
            { name: "Home", url: siteConfig.url },
            { name: "Olympiads", url: `${siteConfig.url}/olympiads` },
            { name: `${olympiad.name.en} Olympiad`, url },
          ]),
          faqJsonLd(faqItems),
        ]}
      />
      <OlympiadPortal olympiad={olympiad} />
    </>
  );
}
