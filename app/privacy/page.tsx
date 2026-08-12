'use client';

import { useEffect, useRef, useState } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import { springDefault } from '@/components/marketing/motion';

/**
 * /privacy — restyled onto the --xlu-* system.
 *
 * New style element introduced here: a sticky section index with scroll-spy.
 * A ten-section legal document is unreadable as one scrolling wall — the real
 * usability problem on this page was navigation, not decoration. The index
 * lets a reader jump straight to the section they care about and shows where
 * they are as they scroll, using the site's connected-node rail as the marker.
 *
 * Content is untouched. Every section title, paragraph, list item, address
 * line and the effective date are verbatim.
 *
 * apple-design:
 *  §1  the active index node updates continuously while scrolling
 *  §12 material weight encodes hierarchy — the document body is the heaviest
 *      surface, the index rail recedes
 *  §14 smooth-scroll and reveal both degrade under reduced motion
 */

const EFFECTIVE_DATE = 'April 7, 2026';
const MONO = 'var(--xlu-font-mono)';

/** Section ids drive both the anchors and the index — single source of truth. */
const SECTIONS = [
    { id: 'information-we-collect', title: '1. Information We Collect' },
    { id: 'tracking-analytics', title: '2. Tracking & Analytics' },
    { id: 'how-we-use', title: '3. How We Use Your Data' },
    { id: 'third-party', title: '4. Third-Party Data Sharing' },
    { id: 'data-security', title: '5. Data Security' },
    { id: 'your-rights', title: '6. Your Rights (GDPR & CCPA)' },
    { id: 'data-retention', title: '7. Data Retention' },
    { id: 'cookies', title: '8. Cookies & Tracking Technologies' },
    { id: 'policy-changes', title: '9. Changes to This Policy' },
    { id: 'contact-us', title: '10. Contact Us' },
];

// ─── Layout helpers ──────────────────────────────────────────────────────────

function SectionBlock({
    id,
    title,
    children,
}: {
    id: string;
    title: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className='scroll-mt-28'>
            <div className='mb-5 flex items-center gap-3'>
                <div
                    className='h-7 w-1 shrink-0 rounded-full'
                    style={{ background: 'var(--xlu-brand-gradient)' }}
                />
                <h2 className='text-xl font-bold tracking-[-0.015em] md:text-2xl'>{title}</h2>
            </div>
            <div
                className='space-y-4 leading-relaxed'
                style={{ color: 'var(--xlu-ink-muted)' }}
            >
                {children}
            </div>
        </section>
    );
}

function SubHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className='mb-2 mt-6 font-semibold' style={{ color: 'var(--xlu-ink)' }}>
            {children}
        </h3>
    );
}

function List({ items }: { items: string[] }) {
    return (
        <ul className='space-y-2.5'>
            {items.map((item, i) => (
                <li key={i} className='flex items-start gap-3'>
                    <span
                        className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full'
                        style={{ background: 'var(--xlu-brand-1)', opacity: 0.7 }}
                    />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PrivacyPolicyPage() {
    const reduced = useReducedMotion();
    const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Scroll-spy — marks the section currently in view.
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
        );
        observerRef.current = io;
        for (const s of SECTIONS) {
            const el = document.getElementById(s.id);
            if (el) io.observe(el);
        }
        return () => io.disconnect();
    }, []);

    return (
        <main className='xlu min-h-screen'>
            <div className='xlu-container'>
                {/* ============ HEADER ============ */}
                <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)] text-center'>
                    <BlueprintGrid />
                    <CornerBrackets />

                    <motion.div
                        className='relative mx-auto max-w-3xl'
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={reduced ? { duration: 0.25 } : springDefault}
                    >
                        <div
                            className='mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                background: 'var(--xlu-surface-1)',
                                color: 'var(--xlu-ink-subtle)',
                            }}
                        >
                            <span
                                className='h-1.5 w-1.5 rounded-full'
                                style={{ background: 'var(--xlu-brand-1)' }}
                            />
                            Legal Document
                        </div>
                        <h1 className='mb-4 text-5xl font-bold tracking-[-0.02em] md:text-6xl'>
                            Privacy <span className='xlu-brand-text'>Policy</span>
                        </h1>
                        <p className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                            Effective Date:{' '}
                            <span className='font-semibold' style={{ color: 'var(--xlu-ink)' }}>
                                {EFFECTIVE_DATE}
                            </span>
                        </p>
                    </motion.div>
                </section>

                <div className='mx-auto grid max-w-6xl gap-[var(--xlu-space-lg)] pb-[var(--xlu-space-2xl)] lg:grid-cols-[0.32fr_0.68fr]'>
                    {/* ============ STICKY SECTION INDEX ============ */}
                    <nav aria-label='Document sections' className='hidden lg:block'>
                        <div className='sticky top-28'>
                            <p
                                className='mb-4 text-[0.65rem] uppercase'
                                style={{
                                    fontFamily: MONO,
                                    letterSpacing: '0.16em',
                                    color: 'var(--xlu-ink-faint)',
                                }}
                            >
                                Contents
                            </p>
                            <ul className='relative space-y-1'>
                                {/* Index rail */}
                                <span
                                    aria-hidden
                                    className='absolute bottom-1 left-[3px] top-1 w-px'
                                    style={{ background: 'var(--xlu-hairline)' }}
                                />
                                {SECTIONS.map((s) => {
                                    const active = activeId === s.id;
                                    return (
                                        <li key={s.id} className='relative'>
                                            <a
                                                href={`#${s.id}`}
                                                className='group flex items-start gap-3 py-1.5 text-sm transition-colors duration-[var(--xlu-dur-base)]'
                                                style={{
                                                    color: active ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-subtle)',
                                                }}
                                            >
                                                <span
                                                    aria-hidden
                                                    className='relative mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-[var(--xlu-dur-base)]'
                                                    style={{
                                                        background: active
                                                            ? 'var(--xlu-brand-1)'
                                                            : 'var(--xlu-ink-faint)',
                                                        transform: active ? 'scale(1.5)' : 'scale(1)',
                                                        boxShadow: active ? '0 0 8px 1px var(--xlu-brand-1)' : 'none',
                                                    }}
                                                />
                                                <span className='leading-snug'>{s.title}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>

                    {/* ============ DOCUMENT BODY ============ */}
                    <motion.div
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={reduced ? { duration: 0.25 } : { ...springDefault, delay: 0.08 }}
                    >
                        <div
                            className='relative space-y-12 overflow-hidden rounded-2xl border p-[clamp(1.5rem,4vw,3rem)]'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                background:
                                    'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                                boxShadow: '0 32px 90px -34px rgba(0,0,0,0.9)',
                            }}
                        >
                            {/* Introduction */}
                            <div className='space-y-4 leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                                <p>
                                    XLEVELSUP (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates as an end-to-end technology solutions and
                                    software engineering firm. This Privacy Policy governs how we collect, process, store,
                                    and protect personal data obtained through our website (xlevelsup.com), our service
                                    delivery workflows, and our digital marketing infrastructure.
                                </p>
                                <p>
                                    By accessing our website or engaging with our services, you acknowledge and agree to
                                    the terms of this Privacy Policy. If you do not agree, please discontinue use of our
                                    platform immediately.
                                </p>
                            </div>

                            {/* 1. Information We Collect */}
                            <SectionBlock id='information-we-collect' title='1. Information We Collect'>
                                <p>
                                    We collect the following categories of personal data through defined touchpoints
                                    across our digital infrastructure:
                                </p>

                                <SubHeading>a. Contact &amp; Inquiry Data</SubHeading>
                                <List items={[
                                    'Full name, email address, phone number, and company name submitted via our contact forms.',
                                    'Nature of the business inquiry and any supporting detail you voluntarily provide.',
                                    'Consent records and submission timestamps retained for compliance purposes.',
                                ]} />

                                <SubHeading>b. Booking &amp; Scheduling Data</SubHeading>
                                <List items={[
                                    'Meeting preferences, time zones, and calendar metadata collected via Cal.com when you schedule a discovery or strategy call.',
                                    'Post-meeting notes and communication history retained in our CRM system.',
                                ]} />

                                <SubHeading>c. Technical &amp; Behavioural Data</SubHeading>
                                <List items={[
                                    'IP address, browser type, operating system, referral URL, and device identifiers.',
                                    'Pages visited, session duration, scroll depth, and click-path analytics.',
                                    'Conversion events triggered on our website (e.g., form submissions, CTA clicks, booking completions).',
                                ]} />

                                <SubHeading>d. Client &amp; Project Data</SubHeading>
                                <List items={[
                                    'Business information, technical requirements, and project specifications shared during an active engagement.',
                                    'Access credentials and API keys provided for integration work—stored in encrypted, access-controlled vaults and never committed to version control.',
                                ]} />
                            </SectionBlock>

                            {/* 2. Tracking & Analytics */}
                            <SectionBlock id='tracking-analytics' title={<>2. Tracking &amp; Analytics</>}>
                                <p>
                                    We operate a multi-layer analytics infrastructure designed for precise measurement of
                                    marketing performance and product behaviour. This includes:
                                </p>

                                <SubHeading>Google Analytics 4 (GA4)</SubHeading>
                                <p>
                                    We use GA4 to capture session-level behavioural data, traffic attribution, and
                                    conversion funnel analysis. Data is processed under Google&rsquo;s Data Processing
                                    Addendum and may be stored on Google&rsquo;s infrastructure outside your country of
                                    residence.
                                </p>

                                <SubHeading>Meta Pixel &amp; Conversions API (CAPI)</SubHeading>
                                <p>
                                    We deploy the Meta Pixel for client-side event tracking and supplement it with
                                    server-side tracking via Meta&rsquo;s Conversions API (CAPI). This server-side layer
                                    transmits hashed event data—including hashed email addresses and phone numbers—
                                    directly from our servers to Meta&rsquo;s platform to improve ad measurement accuracy
                                    and reduce reliance on browser-based cookies. All personally identifiable signals are
                                    hashed using SHA-256 prior to transmission.
                                </p>

                                <SubHeading>Server-Side Tag Management</SubHeading>
                                <p>
                                    We employ server-side tagging infrastructure to process and route analytics events
                                    before they reach third-party platforms. This provides greater control over data
                                    fidelity, reduces client-side script load, and limits raw user data exposure to
                                    third-party JavaScript environments.
                                </p>
                                <p>
                                    You may opt out of analytics tracking by enabling your browser&rsquo;s Do Not Track
                                    signal, using a compliant ad blocker, or exercising your rights as described in
                                    Section 6 of this policy.
                                </p>
                            </SectionBlock>

                            {/* 3. How We Use Your Data */}
                            <SectionBlock id='how-we-use' title='3. How We Use Your Data'>
                                <p>We process your personal data for the following lawful purposes:</p>
                                <List items={[
                                    'Service Delivery: To scope, architect, and deliver software engineering and digital growth solutions tailored to your business.',
                                    'Communication: To respond to inquiries, send project updates, and conduct client onboarding.',
                                    'Marketing & Retargeting: To run algorithmic advertising campaigns on platforms including Meta and Google, optimised using behavioural signals and lookalike audience modelling.',
                                    'Analytics & Optimisation: To measure campaign performance, improve user experience, and inform product and infrastructure decisions.',
                                    'Legal & Compliance: To fulfil contractual obligations, maintain records for financial audits, and respond to lawful requests from regulatory authorities.',
                                    'Recruitment: If you apply for a position, to evaluate your application and communicate with you throughout the hiring process.',
                                ]} />
                            </SectionBlock>

                            {/* 4. Third-Party Sharing */}
                            <SectionBlock id='third-party' title='4. Third-Party Data Sharing'>
                                <p className='font-semibold' style={{ color: 'var(--xlu-ink)' }}>
                                    We do not sell, rent, or trade your personal data to any third party.
                                </p>
                                <p>
                                    We share data only with trusted infrastructure and service partners who are bound by
                                    contractual data processing agreements (DPAs) and operate under industry-standard
                                    security controls. These partners include:
                                </p>
                                <List items={[
                                    'Amazon Web Services (AWS): Cloud hosting, storage, and compute infrastructure.',
                                    'Vercel: Application deployment and edge-network hosting for our web platform.',
                                    'Google Workspace: Business email, document collaboration, and internal communication.',
                                    'Cal.com: Meeting scheduling and calendar management.',
                                    'CRM Platforms: Client relationship management and sales pipeline tracking.',
                                    'Meta Platforms: Advertising campaign management and server-side conversion data sharing.',
                                    'Google Ads / Google Marketing Platform: Paid search and display campaign management.',
                                ]} />
                                <p>
                                    All third-party partners are selected based on their compliance posture, data residency
                                    policies, and security certifications. We conduct periodic reviews of these
                                    partnerships.
                                </p>
                                <p>
                                    We may disclose your data to legal authorities when required by applicable law, court
                                    order, or governmental regulation, and only to the minimum extent necessary.
                                </p>
                            </SectionBlock>

                            {/* 5. Data Security */}
                            <SectionBlock id='data-security' title='5. Data Security'>
                                <p>
                                    We implement technical and organisational measures commensurate with the sensitivity
                                    of the data we process. Our security posture includes:
                                </p>
                                <List items={[
                                    'Encryption in Transit: All data transmitted between your browser and our servers is protected via TLS 1.2/1.3.',
                                    'Encryption at Rest: Sensitive client data and credentials are stored using AES-256 encryption.',
                                    'Access Control: Systems are governed by role-based access control (RBAC). Access to personal data is granted on a strict need-to-know basis.',
                                    'Secure Cloud Infrastructure: Our production environment runs on SOC 2-compliant platforms (AWS, Vercel).',
                                    'Credential Management: Client API keys and secrets are stored in encrypted vaults and never committed to version control repositories.',
                                    'Regular Security Reviews: We conduct internal security assessments and rely on our cloud providers’ ongoing penetration testing and compliance programmes.',
                                ]} />
                                <p>
                                    Despite these controls, no system is impenetrable. In the event of a data breach that
                                    poses a material risk to your rights and freedoms, we will notify affected individuals
                                    and relevant supervisory authorities within the timeframes required by applicable law.
                                </p>
                            </SectionBlock>

                            {/* 6. Your Rights */}
                            <SectionBlock id='your-rights' title={<>6. Your Rights (GDPR &amp; CCPA)</>}>
                                <p>
                                    Depending on your jurisdiction, you may have the following rights regarding your
                                    personal data:
                                </p>

                                <SubHeading>Under GDPR (EU / EEA Residents)</SubHeading>
                                <List items={[
                                    'Right to Access: Request a copy of the personal data we hold about you.',
                                    'Right to Rectification: Request correction of inaccurate or incomplete data.',
                                    'Right to Erasure: Request deletion of your data where there is no lawful basis for continued processing.',
                                    'Right to Restriction: Request that we limit the manner in which we process your data.',
                                    'Right to Data Portability: Request your data in a structured, machine-readable format.',
                                    'Right to Object: Object to processing based on legitimate interests or for direct marketing purposes.',
                                    'Right to Withdraw Consent: Where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.',
                                ]} />

                                <SubHeading>Under CCPA (California Residents)</SubHeading>
                                <List items={[
                                    'Right to Know: Request disclosure of the categories and specific pieces of personal information we have collected.',
                                    'Right to Delete: Request deletion of personal information, subject to statutory exceptions.',
                                    'Right to Opt-Out of Sale: We do not sell personal information; no opt-out is required.',
                                    'Right to Non-Discrimination: We will not discriminate against you for exercising your privacy rights.',
                                ]} />

                                <p>
                                    To exercise any of the above rights, please contact us at{' '}
                                    <a
                                        href='mailto:hello@xlevelsup.com'
                                        className='xlu-link'
                                        style={{ color: 'var(--xlu-brand-1)' }}
                                    >
                                        hello@xlevelsup.com
                                    </a>
                                    . We will respond within 30 days of receiving a verifiable request.
                                </p>
                            </SectionBlock>

                            {/* 7. Data Retention */}
                            <SectionBlock id='data-retention' title='7. Data Retention'>
                                <p>
                                    We retain personal data only for as long as necessary to fulfil the purpose for which
                                    it was collected, or as required by applicable law:
                                </p>
                                <List items={[
                                    'Inquiry & Contact Data: Retained for up to 24 months from the date of last interaction, or until you request deletion.',
                                    'Client Project Data: Retained for the duration of the engagement and up to 5 years thereafter for legal and financial audit purposes.',
                                    'Analytics Data: Session-level data is retained in accordance with the retention policies of our analytics providers (typically 14 months for GA4).',
                                    'Job Application Data: Retained for up to 12 months following the conclusion of the relevant recruitment process.',
                                ]} />
                            </SectionBlock>

                            {/* 8. Cookies */}
                            <SectionBlock id='cookies' title={<>8. Cookies &amp; Tracking Technologies</>}>
                                <p>
                                    Our website uses cookies and similar tracking technologies to enhance user experience
                                    and measure marketing performance. The categories we use are:
                                </p>
                                <List items={[
                                    'Strictly Necessary Cookies: Essential for core website functionality. These cannot be disabled.',
                                    'Analytics Cookies: Used by GA4 to collect aggregate session data. Can be opted out via browser settings or by enabling Do Not Track.',
                                    'Marketing Cookies: Used for ad retargeting and conversion tracking via Meta Pixel and Google Ads. Controlled via your ad preferences on those respective platforms.',
                                ]} />
                                <p>
                                    You can manage cookie preferences via your browser settings. Note that disabling
                                    certain cookies may affect the functionality of parts of our website.
                                </p>
                            </SectionBlock>

                            {/* 9. Policy Changes */}
                            <SectionBlock id='policy-changes' title='9. Changes to This Policy'>
                                <p>
                                    We may update this Privacy Policy periodically to reflect changes in our data
                                    practices, technology infrastructure, or applicable law. Material changes will be
                                    communicated by updating the &ldquo;Effective Date&rdquo; at the top of this document.
                                    We encourage you to review this page periodically to remain informed.
                                </p>
                                <p>
                                    Continued use of our website or services following a policy update constitutes your
                                    acceptance of the revised terms.
                                </p>
                            </SectionBlock>

                            {/* 10. Contact */}
                            <SectionBlock id='contact-us' title='10. Contact Us'>
                                <p>
                                    For privacy-related enquiries, data subject requests, or to report a concern, please
                                    contact our designated privacy point of contact:
                                </p>
                                <div
                                    className='mt-2 space-y-1 rounded-xl border p-6'
                                    style={{
                                        borderColor: 'var(--xlu-hairline)',
                                        background: 'var(--xlu-surface-2)',
                                    }}
                                >
                                    <p className='font-semibold' style={{ color: 'var(--xlu-ink)' }}>
                                        XLEVELSUP — Privacy Office
                                    </p>
                                    <p className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                                        2nd floor, 178, A, Ramachandra Rd,
                                    </p>
                                    <p className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                                        R.S. Puram, Coimbatore &mdash; 641002, Tamil Nadu, India
                                    </p>
                                    <a
                                        href='mailto:hello@xlevelsup.com'
                                        className='xlu-link block pt-1 text-sm'
                                        style={{ color: 'var(--xlu-brand-1)' }}
                                    >
                                        hello@xlevelsup.com
                                    </a>
                                </div>
                            </SectionBlock>
                        </div>

                        {/* Footer note */}
                        <p
                            className='mt-8 text-center text-xs'
                            style={{ color: 'var(--xlu-ink-faint)' }}
                        >
                            This document was last reviewed on {EFFECTIVE_DATE} and supersedes all prior versions.
                        </p>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
