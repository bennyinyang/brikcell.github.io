import { Header } from "@/components/header"
import { FileText } from "lucide-react"

const LAST_UPDATED = "July 22, 2026"
const COMPANY_NAME = "Brikcell Marketplace"
const CONTACT_EMAIL = "brikcellsupport@mail.com"

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: `By accessing or using the Brikcell platform ("Platform"), including its website, mobile applications, and related services, you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and Brikcell Development Services Ltd ("Brikcell", "we", "us", or "our").

If you do not agree to these Terms, you must not access or use the Platform. By creating an account or by continuing to use the Platform, you confirm that you have read, understood, and agreed to these Terms and our Privacy Policy, which is incorporated herein by reference.

We reserve the right to update or modify these Terms at any time. We will notify you of material changes via email or an in-app notice. Your continued use of the Platform after such notification constitutes your acceptance of the revised Terms.`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility & Account Registration",
    body: `Eligibility
To use the Platform, you must:
• Be at least 18 years of age and have the legal capacity to enter into a binding contract.
• Not be barred from receiving services under applicable laws.
• Provide accurate and complete registration information and keep it up to date.
• Not have had a Brikcell account previously suspended or terminated for violation of these Terms.

Account Security
You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately at ${CONTACT_EMAIL} if you suspect any unauthorized access to or use of your account. Brikcell will not be liable for any loss resulting from unauthorized use of your account.

Account Types
The Platform supports two account types:
• Employers – individuals or businesses seeking to hire Artisans for projects or services.
• Artisans – skilled professionals offering services through the Platform.

You may only hold one active account per account type unless expressly authorized by Brikcell in writing.`,
  },
  {
    id: "platform-description",
    title: "3. Platform Description & Role",
    body: `Brikcell is an online marketplace that facilitates connections between Employers seeking skilled services and Artisans offering those services. Brikcell acts solely as an intermediary technology platform and is not a party to any agreement, contract, or transaction entered into between Employers and Artisans.

Brikcell does not:
• Employ, endorse, or guarantee the performance, quality, or reliability of any Artisan.
• Supervise, direct, or control the work performed by Artisans.
• Guarantee that Employers will find suitable Artisans or that Artisans will secure work.
• Verify the accuracy of all information posted by users, although we reserve the right to do so.

The relationship between an Employer and an Artisan is that of independent contracting parties. Nothing in these Terms creates an employment, agency, partnership, or joint venture relationship between Brikcell and any user, or between Employers and Artisans.`,
  },
  {
    id: "user-conduct",
    title: "4. User Conduct & Prohibited Activities",
    body: `General Obligations
All users agree to use the Platform in a lawful, respectful, and honest manner. You are responsible for all content you post and all activities conducted through your account.

Prohibited Activities
You agree NOT to:
• Use the Platform for any illegal purpose or in violation of applicable laws or regulations.
• Post false, misleading, or inaccurate information about yourself, your qualifications, or your services.
• Harass, abuse, threaten, or discriminate against other users on any basis including race, gender, religion, disability, or nationality.
• Attempt to bypass the Platform to conduct transactions off-platform in order to avoid fees or circumvent Brikcell's policies.
• Use automated bots, scrapers, or other unauthorized tools to access or extract data from the Platform.
• Post or transmit any content that is defamatory, obscene, pornographic, hateful, or that infringes any third-party intellectual property rights.
• Attempt to gain unauthorized access to other users' accounts or any part of the Platform's systems.
• Engage in price manipulation, bid manipulation, or other dishonest marketplace conduct.
• Create multiple accounts to abuse review systems, referral programs, or dispute processes.
• Solicit other users' personal contact information for the purpose of communicating outside the Platform to avoid fees.

Artisan-Specific Obligations
• Artisans must accurately represent their skills, qualifications, certifications, and experience.
• Artisans must only accept jobs they have the genuine capability to complete to a professional standard.
• Artisans must not subcontract work to third parties without the Employer's prior written consent.

Employer-Specific Obligations
• Employers must provide clear, accurate project descriptions and requirements.
• Employers must not request Artisans to perform work that is illegal, unsafe, or outside the agreed scope without additional compensation.
• Employers must release milestone payments in a timely manner upon satisfactory completion of agreed deliverables.`,
  },
  {
    id: "services-contracts",
    title: "5. Services, Contracts & Milestones",
    body: `Service Listings
Artisans may create service listings ("Gigs") on the Platform detailing their offerings, rates, availability, and relevant terms. Employers may post job opportunities and invite Artisans to apply. All listings must be accurate, lawful, and compliant with Brikcell's content policies.

Contract Formation
A contract between an Employer and an Artisan is formed when both parties agree to the scope of work, timeline, and payment terms through the Platform's contract tools. Brikcell is not a party to this contract. Both parties are encouraged to define deliverables, milestones, and revision terms clearly before work commences.

Milestones
Projects on Brikcell are structured around milestones. Milestone payments are held in escrow by Brikcell and released to the Artisan upon the Employer's approval of the completed work for that milestone. If the Employer does not approve or dispute a milestone within the period specified in the Platform's dispute resolution policy, the milestone may be automatically released.

Scope Changes
Any changes to the agreed scope, timeline, or payment terms must be mutually agreed upon by both parties in writing through the Platform. Verbal or off-platform agreements are not recognized by Brikcell for dispute resolution purposes.`,
  },
  {
    id: "payments-fees",
    title: "6. Payments, Fees & Escrow",
    body: `Escrow & Payment Processing
Brikcell uses an escrow mechanism to protect both parties. Employer payments are held securely until milestone completion is approved. Payments are processed through third-party payment processors, and by using the Platform you agree to the terms of those processors.

Platform Fees
Brikcell charges a platform service fee on transactions conducted through the Platform. The applicable fee rate is displayed at the time of contract creation and is subject to change with reasonable notice. Fees are non-refundable except as expressly stated in these Terms or required by applicable law.

Withdrawals
Artisans may withdraw their earnings from their Brikcell wallet to their linked bank account or payment method. Brikcell does not charge a platform fee on withdrawals. Third-party transfer fees charged by payment processors or banks remain the responsibility of the user.

Taxes
Each user is solely responsible for determining and fulfilling their applicable tax obligations arising from their use of the Platform. Brikcell does not withhold taxes on behalf of users unless required by applicable law. Where required, Brikcell may collect tax-related documentation from users.

Currency
All transactions on the Platform are conducted in Nigerian Naira (NGN) unless otherwise specified. Brikcell is not responsible for any currency conversion losses or fees.

Failed Payments
If a payment fails or is reversed (e.g., through a chargeback), Brikcell reserves the right to suspend or terminate the relevant account and pursue recovery of owed amounts through available legal means.`,
  },
  {
    id: "dispute-resolution",
    title: "7. Dispute Resolution",
    body: `Between Users
Brikcell encourages Employers and Artisans to resolve disputes amicably through direct communication on the Platform. If a resolution cannot be reached, either party may escalate the matter through Brikcell's formal dispute resolution process.

Brikcell's Dispute Process
When a dispute is escalated, Brikcell will review the evidence submitted by both parties, including messages, uploaded files, milestone records, and contract terms. Brikcell will make a determination based on the available evidence. Both parties agree that Brikcell's decision in the dispute resolution process is final and binding.

Disputes must be initiated within 14 days of the disputed event. Brikcell reserves the right to extend or shorten this window at its discretion.

Limitation of Brikcell's Role
Brikcell's dispute resolution service is provided as a platform convenience. Brikcell does not assume liability for any determination made and is not a judicial or arbitral body. Providing dispute resolution services does not make Brikcell a party to the underlying contract between users.

Governing Law
Any dispute not resolved through the above process shall be subject to the exclusive jurisdiction of the courts of the Federal Republic of Nigeria.`,
  },
  {
    id: "content-policy",
    title: "8. Content Policy & Intellectual Property",
    body: `User-Generated Content
You retain ownership of any content you submit to the Platform ("User Content"), including profile information, service listings, portfolio items, messages, and uploaded files. By submitting User Content, you grant Brikcell a non-exclusive, worldwide, royalty-free license to use, display, reproduce, modify, and distribute that content solely for the purpose of operating, promoting, and improving the Platform.

You represent and warrant that:
• You own or have the necessary rights to all User Content you submit.
• Your User Content does not infringe the intellectual property, privacy, or other rights of any third party.
• Your User Content does not contain malware, viruses, or harmful code.

Brikcell's Intellectual Property
All Platform content, software, designs, logos, trademarks, trade names, and other intellectual property owned by Brikcell are protected by applicable intellectual property laws. You may not use, copy, reproduce, or distribute any of Brikcell's intellectual property without our prior written consent.

Content Removal
Brikcell reserves the right to remove any User Content that violates these Terms, our content policies, or applicable law, without prior notice. Repeated violations may result in account suspension or termination.`,
  },
  {
    id: "verification-reviews",
    title: "9. Identity Verification & Reviews",
    body: `Identity Verification
Brikcell may require users to complete identity verification as a condition of accessing certain features or conducting transactions above specified thresholds. Verification may include submission of government-issued identification, business registration documents, or biometric data. Brikcell uses third-party verification providers and handles verification data in accordance with our Privacy Policy.

Ratings & Reviews
After a transaction is completed, Employers and Artisans may leave ratings and written reviews of each other. Reviews must be honest, fair, and based on genuine experience. Brikcell prohibits:
• Fake or incentivized reviews.
• Reviews intended to harass, defame, or harm another user.
• Review manipulation through secondary accounts.

Brikcell reserves the right to remove reviews that violate these guidelines. Users who believe a review is fraudulent or abusive may report it for investigation.`,
  },
  {
    id: "privacy-data",
    title: "10. Privacy & Data Protection",
    body: `Your use of the Platform is governed by Brikcell's Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your personal information as described in the Privacy Policy.

Brikcell implements industry-standard security measures to protect your personal data. However, no data transmission over the internet or storage system can be guaranteed as 100% secure. You acknowledge this inherent risk and agree that Brikcell shall not be liable for any unauthorized access, breach, or loss of your data that is beyond our reasonable control.

You are responsible for keeping your account information confidential. If you believe your data has been compromised, please contact us immediately at ${CONTACT_EMAIL}.`,
  },
  {
    id: "disclaimers",
    title: "11. Disclaimers & Limitation of Liability",
    body: `Platform Disclaimer
THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED SERVICE.

Brikcell does not warrant that:
• The Platform will be error-free, uninterrupted, or free of viruses or harmful components.
• The results obtained from using the Platform will be accurate or reliable.
• Any Artisan will perform services to any particular standard or within any particular timeframe.

Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BRIKCELL, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, PROPERTY DAMAGE, OR PERSONAL INJURY.

BRIKCELL'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY YOU TO BRIKCELL IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) ₦50,000.

Third-Party Services
Brikcell is not responsible for the acts, omissions, content, or services of any third party, including payment processors, identity verification providers, or external websites linked from the Platform.`,
  },
  {
    id: "indemnification",
    title: "12. Indemnification",
    body: `You agree to indemnify, defend, and hold harmless Brikcell, its directors, officers, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to:

• Your use of or access to the Platform.
• Any User Content you submit, post, or transmit through the Platform.
• Your breach of these Terms or any applicable law or regulation.
• Any dispute between you and another user of the Platform.
• Your infringement of any third-party intellectual property, privacy, or other rights.

Brikcell reserves the right, at its own expense, to assume the exclusive defence and control of any matter subject to indemnification by you, in which event you will cooperate with Brikcell in asserting any available defences.`,
  },
  {
    id: "termination",
    title: "13. Account Suspension & Termination",
    body: `By You
You may close your Brikcell account at any time by contacting us at ${CONTACT_EMAIL} or through the account settings. Closing your account does not relieve you of obligations for outstanding payments, pending contracts, or liabilities incurred prior to closure.

By Brikcell
Brikcell reserves the right to suspend or permanently terminate your account, with or without notice, if we determine in our sole discretion that you have:
• Violated these Terms or any applicable law.
• Engaged in fraudulent, abusive, or harmful conduct.
• Failed to pay amounts owed to Brikcell or other users.
• Provided false or misleading information.
• Posed a risk to the safety or integrity of the Platform or other users.

Effect of Termination
Upon termination, your right to access and use the Platform ceases immediately. Any pending milestone funds may be withheld pending resolution of outstanding disputes or obligations. Sections of these Terms that by their nature should survive termination (including payment obligations, intellectual property rights, disclaimers, indemnification, and dispute resolution) shall survive.`,
  },
  {
    id: "modifications",
    title: "14. Modifications to the Platform & Terms",
    body: `Brikcell reserves the right to modify, suspend, or discontinue any part of the Platform at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the Platform.

We may update these Terms at any time. When we make material changes, we will provide notice via email to your registered address or a prominent notice on the Platform at least 14 days before the changes take effect. Your continued use of the Platform after the effective date of the revised Terms constitutes your acceptance.

If you do not agree to the revised Terms, you must stop using the Platform and close your account before the effective date.`,
  },
  {
    id: "general",
    title: "15. General Provisions",
    body: `Entire Agreement
These Terms, together with our Privacy Policy and any additional terms applicable to specific services, constitute the entire agreement between you and Brikcell regarding your use of the Platform and supersede all prior agreements, understandings, and representations.

Severability
If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision shall be deemed severable from the remaining provisions, which shall remain in full force and effect.

Waiver
Brikcell's failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.

Assignment
You may not assign or transfer your rights or obligations under these Terms without Brikcell's prior written consent. Brikcell may freely assign its rights and obligations under these Terms.

Governing Law & Jurisdiction
These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law principles. Any legal action arising under these Terms shall be brought exclusively in the competent courts of Nigeria.

Language
These Terms are written in English. In the event of any inconsistency between the English version and any translated version, the English version shall prevail.

Contact Us
For questions, concerns, or notices regarding these Terms, please contact us at: ${CONTACT_EMAIL}`,
  },
]

export default function TermsOfServicePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20">
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Legal</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Terms of Service
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              Please read these Terms carefully before using {COMPANY_NAME}. By accessing or using
              the Platform, you agree to be bound by these Terms.
            </p>

            <p className="mt-4 text-sm text-slate-400">
              Last updated: <span className="font-medium text-slate-600">{LAST_UPDATED}</span>
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
              {/* Notice banner */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
                <p className="text-sm font-semibold text-primary">Important notice</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  These Terms of Service govern your use of the Brikcell platform. By creating an
                  account you confirm you have read and agreed to these Terms and our{" "}
                  <a href="/privacy" className="font-medium text-primary underline underline-offset-2">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              {/* ToS sections */}
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
                <h3 className="text-lg font-semibold">Questions about our Terms?</h3>
                <p className="mt-2 text-sm text-white/80">
                  Our team is happy to clarify anything before you get started.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90"
                >
                  Contact us
                </a>
              </div>
            </article>
          </div>
        </div>
      </main>
    </>
  )
}
