import { Header } from "@/components/header"
import { Building2 } from "lucide-react"

const COMPANY_NAME = "Brikcell Marketplace"
const CONTACT_EMAIL = "brikcellsupport@mail.com"
const FOUNDED_YEAR = "2024"

const sections = [
  {
    id: "our-story",
    title: "Our Story",
    body: `Brikcell was born out of a straightforward observation: finding a reliable, skilled artisan in Nigeria was harder than it should be. Homeowners and businesses struggled to connect with qualified tradespeople — and talented craftspeople struggled to find steady, fairly-compensated work.

We set out to change that. Founded in ${FOUNDED_YEAR}, Brikcell was built as a trusted digital marketplace that bridges the gap between those who need skilled services and the artisans who can deliver them — transparently, safely, and on fair terms.

What started as a simple idea has grown into a platform where thousands of real connections are made: plumbers, electricians, carpenters, painters, welders, and many other skilled professionals finding work, and clients finding the right person for the job — all in one place.`,
  },
  {
    id: "our-mission",
    title: "Our Mission",
    body: `Our mission is to build the most trusted marketplace for skilled trades in Africa — starting with Nigeria.

We believe that:
• Every client deserves access to verified, skilled professionals without the guesswork.
• Every artisan deserves a fair platform to showcase their talent and earn their worth.
• Every transaction should be safe, transparent, and protected from the moment it begins to the moment it ends.

We are not just building a hiring platform. We are building economic infrastructure — creating a space where skilled labour is valued, rewarded, and respected, and where both parties can transact with complete confidence.`,
  },
  {
    id: "what-we-do",
    title: "What We Do",
    body: `Brikcell is an end-to-end marketplace for skilled artisan services. Here is what that means in practice:

For Employers (Clients)
Browse verified artisan profiles, review portfolios and ratings, post jobs, and hire with confidence. Whether you need a one-day repair or a multi-phase construction project, Brikcell gives you the tools to define the scope, set the terms, and fund the work safely.

For Artisans (Skilled Professionals)
Create a professional profile, showcase your work, bid on posted jobs, and get paid promptly for completed milestones. Brikcell handles the contract, the payment structure, and the dispute safety net — so you can focus on the work.

For Both Parties
Every project on Brikcell is backed by:
• A structured contract with clearly defined phases and deliverables.
• Escrow-protected payments that are held securely and only released when you approve.
• An in-platform messaging system for communication and file sharing.
• A fair and evidence-based dispute resolution process if anything goes wrong.`,
  },
  {
    id: "how-it-works",
    title: "How It Works",
    body: `Brikcell makes hiring simple and safe with a structured, milestone-based workflow:

1. Post or Browse
Clients post a job or browse artisan profiles by trade, location, availability, and rating. Artisans set up professional profiles with their services, experience, and portfolio.

2. Agree on a Contract
Once both parties connect, they use Brikcell's built-in contract builder to define the scope of work, payment phases (milestones), materials responsibilities, and timelines.

3. Fund the Escrow
Before work begins, the client funds the first milestone payment into Brikcell's secure escrow. This confirms commitment and protects both sides — the artisan knows payment is secured, and the client knows funds are only released upon approval.

4. Work Gets Done
The artisan completes each phase. Once the client is satisfied, they approve the milestone and the artisan is paid that phase's amount directly into their Brikcell wallet.

5. Completion & Review
When the project is fully complete, both parties can leave honest ratings and reviews — building a reputation system that benefits the entire community.`,
  },
  {
    id: "escrow-trust",
    title: "Escrow & Trust",
    body: `Trust is not a feature on Brikcell — it is the foundation.

How Our Escrow Works
When a client funds a project on Brikcell, the payment is held securely in escrow — it is not paid to the artisan until the client explicitly approves the completed work for that milestone. This protects clients from paying for unfinished or unsatisfactory work, and it guarantees artisans that payment is available and waiting the moment they deliver.

Two-Phase Payment Structure
Brikcell uses a transparent two-phase payment model per milestone:
• Phase 1 (Material & Deposit): Covers material costs and a portion of the labour fee, released at the start of a milestone so the artisan can procure what is needed.
• Phase 2 (Final Labour): The remaining labour fee, released only after the client approves the completed work.

Platform Fee
Brikcell charges a small platform fee on the labour portion of each transaction. This fee covers the cost of maintaining the escrow system, fraud prevention, customer support, and platform improvements. It is displayed clearly at the time of contract creation — no hidden charges.

Dispute Resolution
If a disagreement arises, either party may raise a formal dispute. Brikcell reviews all submitted evidence — messages, files, milestone records, and contract terms — and makes a fair, evidence-based determination. Our goal is always a just outcome for both parties.`,
  },
  {
    id: "our-values",
    title: "Our Values",
    body: `The principles that guide every decision we make at Brikcell:

Transparency
We believe every party should know exactly what is happening with their money, their contract, and their project at every stage. No hidden fees. No surprises.

Fairness
Artisans are skilled professionals. They deserve fair pay, timely releases, and a platform that advocates for their value — not one that exploits them. Clients deserve honest pricing and quality assurance.

Security
Every naira on Brikcell is protected. We invest heavily in the security of our payment systems, user data, and platform infrastructure so that everyone can transact with confidence.

Community
We are building a marketplace, but what we care about most is the community it creates — of skilled artisans who are growing their businesses, and clients who keep coming back because they trust the platform.

Accountability
When something goes wrong, we show up. Our support and dispute resolution systems exist to make sure no one is left stranded. We stand behind every transaction made on our platform.`,
  },
  {
    id: "who-we-serve",
    title: "Who We Serve",
    body: `Brikcell is built for anyone who needs skilled hands or wants to offer them.

Clients & Employers
Homeowners undertaking renovations or repairs. Small businesses fitting out new offices. Property developers managing construction phases. Landlords maintaining rental units. If you need skilled, reliable, professional artisan services in Nigeria — Brikcell is for you.

Artisans & Skilled Professionals
Plumbers, electricians, carpenters, painters, tilers, welders, masons, AC technicians, interior designers, landscapers, and more. If you have a skill and you want a platform that pays you fairly, protects your earnings, and helps you build your reputation — Brikcell is for you.

Our Geography
We are currently serving clients and artisans across Nigeria. Our goal is to expand Brikcell's reach across West Africa and ultimately across the continent, bringing trusted skilled-trade infrastructure to every major city.`,
  },
  {
    id: "contact-us",
    title: "Contact & Get Involved",
    body: `We love hearing from the people who use Brikcell — whether you have a question, a suggestion, a partnership idea, or just want to share your experience.

General Enquiries
For questions about how Brikcell works, getting started, or anything else, reach us at: ${CONTACT_EMAIL}

Support
If you have a problem with a transaction, a contract, or your account, our support team is ready to help. Visit our Help & Support page or email us directly and we will respond within 24 hours on business days.

Press & Partnerships
If you are a journalist, researcher, or business interested in partnering with Brikcell, please reach out to us at: ${CONTACT_EMAIL}

Become an Artisan
If you are a skilled professional ready to grow your business on Brikcell, sign up as an artisan today. Getting started is free and takes less than five minutes.

Join Us
Brikcell is growing — and we are always looking for talented, mission-driven people to join our team. If you share our belief in the power of skilled labour and want to help build the infrastructure that supports it, we would love to hear from you.`,
  },
]

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20">
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Company</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              About Brikcell
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              We are building the most trusted marketplace for skilled artisan services in Nigeria —
              connecting talented tradespeople with clients who need them, safely and transparently.
            </p>

            <p className="mt-4 text-sm text-slate-400">
              Founded: <span className="font-medium text-slate-600">{FOUNDED_YEAR}</span>
            </p>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">

            {/* ── Sticky table of contents ── */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Contents
                </p>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-md px-3 py-1.5 text-xs text-slate-600 transition hover:bg-white hover:text-primary"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* ── Sections ── */}
            <article className="space-y-10">
              {/* Mission banner */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
                <p className="text-sm font-semibold text-primary">Our purpose</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {COMPANY_NAME} exists to make skilled labour accessible, trustworthy, and fairly
                  compensated — for every client and every artisan across Nigeria.
                </p>
              </div>

              {/* About sections */}
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-2xl border border-gray-100 bg-white px-6 py-7 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-slate-950">
                    {section.title}
                  </h2>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-sm leading-7 text-slate-600 whitespace-pre-line">
                      {section.body}
                    </p>
                  </div>
                </section>
              ))}

              {/* Bottom CTA */}
              <div className="rounded-2xl bg-primary px-6 py-8 text-center text-white">
                <h3 className="text-lg font-semibold">Ready to get started?</h3>
                <p className="mt-2 text-sm text-white/80">
                  Join thousands of clients and artisans already building trust on Brikcell.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90"
                  >
                    Create an account
                  </a>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Contact us
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
    </>
  )
}
