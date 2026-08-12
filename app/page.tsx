import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import SocialProof from '@/components/sections/SocialProof';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';
import LeadMagnetPopup from '@/components/LeadMagnetPopup';
import { SnapScroll, SnapSection } from '@/components/marketing/SnapScroll';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Digital Marketing, Web Design & AI Automation Agency India | XLEVELSUP',
  description:
    'XLEVELSUP is your end-to-end growth partner in India. We design logos, build websites & eCommerce stores, run Meta & Google Ads, manage social media, develop ERP apps, and automate workflows with AI.',
  alternates: {
    canonical: '/',
  },
  keywords: [
    'Logo Design Company India',
    'Brand Identity Design',
    'Social Media Agency Coimbatore',
    'Meta Ads Management',
    'Google Ads Agency India',
    'Website Development Coimbatore',
    'eCommerce Development India',
    'ERP Development India',
    'AI Automation India',
    'Digital Marketing Agency Coimbatore',
    'XLEVELSUP',
    'XLU',
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does XLEVELSUP actually do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'XLEVELSUP is your end-to-end growth partner. We handle everything a business needs to grow digitally — logo and brand identity design, marketing and eCommerce websites, Meta Ads and social media management, Google Ads campaigns, ERP and enterprise software development, and AI workflow automation. One partner. All disciplines. All under one roof in Coimbatore, India.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are you an agency or a software company?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Both — and that's the point. Most agencies can't write code. Most software companies can't run ads. XLEVELSUP combines both. We're a full-service digital agency that also builds enterprise-grade software, ERP systems, and AI automation. You get creative execution and engineering depth from the same team, with no handoff problems between vendors.",
      },
    },
    {
      '@type': 'Question',
      name: 'How is XLEVELSUP different from other digital agencies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most agencies specialise in one channel — social media, or SEO, or web design. XLEVELSUP covers the entire stack: design, development, advertising, automation, and analytics. Our approach is engineering-driven — we apply data and systems thinking to every service, not guesswork. And because we build both the marketing and the technology, every layer compounds on the one before it.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does working with XLEVELSUP look like?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "We start with a discovery session to understand your business, goals, and current gaps. From there, we propose the specific services that will move the needle — whether that's a website rebuild, an ad campaign, an ERP system, or AI automation. We work in focused sprints with clear deliverables, keeping you informed at every stage. Most clients start seeing measurable results within 30–60 days.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get started?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Simple — fill out the contact form or reach out directly at hello@xlevelsup.com. We'll schedule a free growth audit call where we review your current setup, identify gaps, and outline a clear path forward. No commitment required to start the conversation.",
      },
    },
  ],
};

export default function Home() {
  return (
    <main className='min-h-screen'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Snap is `proximity`, so it only assists near a boundary and never
          traps a user inside a section taller than their screen.
          `snapOnMobile` is opt-in per section: only the hero reliably fits a
          phone viewport, so only the hero snaps on touch. */}
      <SnapScroll>
        <SnapSection snapOnMobile>
          <Hero />
        </SnapSection>
        <SnapSection>
          <Services />
        </SnapSection>
        <SnapSection>
          <SocialProof />
        </SnapSection>
        <SnapSection>
          <About />
        </SnapSection>
        <SnapSection>
          <Testimonials />
        </SnapSection>
        <SnapSection>
          <FAQ />
        </SnapSection>
        <SnapSection>
          <Contact />
        </SnapSection>
      </SnapScroll>
      <LeadMagnetPopup />
    </main>
  );
}
