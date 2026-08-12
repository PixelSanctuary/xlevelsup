'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import LighthouseScore from '@/components/solutions/LighthouseScore';
import EmojiIcon from '@/components/ui/EmojiIcon';

export default function MarketingArchitecturePage() {
    const techStack = [
        {
            name: 'React/Next.js',
            description: 'For SEO and Speed',
            icon: '⚛️',
            features: ['Server-Side Rendering', 'Static Generation', 'API Routes'],
        },
        {
            name: 'Tailwind CSS',
            description: 'For Pixel-Perfect Design',
            icon: '🎨',
            features: ['Utility-First', 'Responsive', 'Custom Themes'],
        },
        {
            name: 'Vercel Edge',
            description: 'For Global Content Delivery',
            icon: '🌐',
            features: ['Edge Functions', 'CDN', 'Zero Config'],
        },
    ];

    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center text-4xl">
                            <EmojiIcon emoji="⚡" className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl font-bold mb-6">
                        Built for <span className="gradient-text">Speed</span>.
                        <br />
                        Designed to <span className="gradient-text">Convert</span>.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We abandon slow WordPress templates for custom Next.js architectures that load instantly.
                        Every millisecond counts when you're converting visitors into customers.
                    </p>
                </motion.div>

                {/* Why Speed Matters */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-8 rounded-2xl">
                        <h2 className="text-3xl font-bold mb-6 text-center">
                            Why <span className="gradient-text">Performance</span> = Revenue
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">53%</div>
                                <p className="text-gray-400 text-sm">of mobile users abandon sites that take over 3 seconds to load</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">100ms</div>
                                <p className="text-gray-400 text-sm">faster load time = 1% increase in conversion rate</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">2x</div>
                                <p className="text-gray-400 text-sm">better SEO rankings for fast-loading sites</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tech Stack Grid */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">Tech Stack</span>
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {techStack.map((tech, index) => (
                            <motion.div
                                key={tech.name}
                                className="glass p-8 rounded-xl hover:border-cyan transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                <div className="text-5xl mb-4 text-cyan flex justify-center">
                                    <EmojiIcon emoji={tech.icon} className="w-12 h-12" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-center">{tech.name}</h3>
                                <p className="text-cyan text-sm mb-4 text-center">{tech.description}</p>
                                <ul className="space-y-2">
                                    {tech.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                                            <span className="text-cyan">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Lighthouse Vitals */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">Vitals</span>
                    </h2>
                    <LighthouseScore />
                </motion.div>

                {/* What You Get */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        What You <span className="gradient-text">Get</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Custom Next.js Architecture', desc: 'No templates. Built from scratch for your business.' },
                            { title: 'Mobile-First Design', desc: 'Optimized for the 70% of users on mobile devices.' },
                            { title: 'SEO Foundation', desc: 'Semantic HTML, meta tags, and structured data built-in.' },
                            { title: 'Conversion Optimization', desc: 'Every element designed to guide users to action.' },
                            { title: 'Analytics Integration', desc: 'Track every interaction, optimize every funnel.' },
                            { title: 'Ongoing Performance', desc: 'Regular audits and optimizations included.' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                className="glass p-6 rounded-xl"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <h3 className="font-bold mb-2 gradient-text">{item.title}</h3>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-3xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-4">
                                Ready to <span className="gradient-text">Upgrade</span> Your Architecture?
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Let's audit your current site and engineer a high-performance solution.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-10 py-5 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-bold text-lg hover:shadow-lg hover:shadow-purple/50 transition-all duration-300 hover:scale-105"
                            >
                                Upgrade My Architecture
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
