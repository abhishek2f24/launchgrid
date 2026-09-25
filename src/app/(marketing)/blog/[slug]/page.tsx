import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { JourneyNav } from '@/components/signup-journey/JourneyNav'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { Footer } from '@/components/signup-journey/Footer'
import { Metadata } from 'next'

import { blogPosts, BLOG_SLUGS, postDescription, postModifiedISO } from '@/lib/blog-posts'

const SITE = 'https://launchgrid.in'

export const dynamicParams = false

export function generateStaticParams() {
  return BLOG_SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = blogPosts[params.slug]
  if (!post) return {}
  const url = `${SITE}/blog/${params.slug}`
  const description = postDescription(post)
  return {
    // Keyword-first and brand-free: long titles get truncated in results.
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      locale: 'en_IN',
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: postModifiedISO(post),
    },
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = blogPosts[params.slug]

  if (!post) notFound()

  const url = `${SITE}/blog/${params.slug}`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: postDescription(post),
        mainEntityOfPage: url,
        datePublished: new Date(post.date).toISOString().slice(0, 10),
        dateModified: postModifiedISO(post),
        inLanguage: 'en-IN',
        author: { '@type': 'Organization', name: 'LaunchGrid', url: SITE },
        publisher: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors mb-12"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>

          <article className="space-y-8">
            <div className="space-y-4">
              <span className="bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit block">
                {post.category}
              </span>
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--color-mark-subtle-text)]">
                <span>Published on {post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
            </div>

            <div className="h-px bg-[var(--color-mark-default)]" />

            <div className="space-y-6 font-inter text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed">
              {post.content.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>

            {post.pillar && (
              <Link
                href={post.pillar.href}
                className="block bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-2xl p-6 font-inter text-sm font-bold text-[var(--color-mark-ink)] hover:underline underline-offset-4"
              >
                Next: {post.pillar.label} →
              </Link>
            )}

            {/* FAQs Accordion / Display (FAQ Schema verified) */}
            <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-8 mt-12 space-y-6">
              <h3 className="font-playfair text-xl md:text-2xl font-bold text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-6 divide-y divide-[var(--color-mark-default)]">
                {post.faqs.map((faq, i) => (
                  <div key={i} className={`${i > 0 ? 'pt-6' : ''} space-y-2`}>
                    <h4 className="font-inter font-bold text-sm md:text-base text-[var(--color-mark-ink)]">
                      {faq.question}
                    </h4>
                    <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
