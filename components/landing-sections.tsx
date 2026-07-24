import Link from "next/link"
import {
  Brush,
  Camera,
  Drill,
  Hammer,
  Lightbulb,
  Monitor,
  PaintRoller,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Wrench,
  Zap,
  CalendarCheck,
  Headphones,
  BriefcaseBusiness,
  UserRoundPlus,
  TrendingUp,
  Settings,
} from "lucide-react"

const services = [
  { title: "Carpentry", icon: Hammer },
  { title: "Electrical", icon: Zap },
  { title: "Painting", icon: PaintRoller },
  { title: "Design", icon: Monitor },
  { title: "Photography", icon: Camera },
  { title: "Plumbing", icon: Wrench },
]

const talents = [
  {
    name: "Emeka Johnson",
    role: "Carpenter",
    image: "/landing/talent-emeka.png",
  },
  {
    name: "Anna James",
    role: "Writer",
    image: "/landing/talent-anna.png",
  },
  {
    name: "Fabian Hanson",
    role: "Graphics designer",
    image: "/landing/talent-fabian.png",
  },
  {
    name: "Henry Bassey",
    role: "Electrician",
    image: "/landing/talent-henry.png",
  },
]

export function TopServicesSection() {
  return (
    <section className="bg-[#090f1c] px-5 py-16 text-white sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Our top services
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Find Services Tailored to Your Needs
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => {
            const Icon = service.icon

            return (
              <div
                key={service.title}
                className="flex h-28 flex-col items-center justify-center rounded-md border border-white/5 bg-[#0b1220] text-center transition hover:border-primary/50"
              >
                <Icon className="h-7 w-7 text-primary" />
                <p className="mt-5 text-sm text-white">{service.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function WhyChooseBrikcellSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Why Choose <span className="text-primary">Brikcell?</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Discover the Brikcell Advantage - Quality Service and Convenience at
            Your Fingertips.
          </p>

          <div className="mt-12 space-y-10">
            <FeatureItem
              icon={ShieldCheck}
              title="Verified artisans"
              description="Our network comprises only the best — skilled and experienced artisans committed to delivering top-notch craftsmanship for your projects."
            />

            <FeatureItem
              icon={Sparkles}
              title="Simplified experience"
              description="Effortlessly search, book, and manage services or showcase your skills and attract clients with our intuitive platform."
            />

            <FeatureItem
              icon={WalletCards}
              title="Transparent and secure payments"
              description="Enjoy safe and transparent financial transactions, with easy tracking of payments, service histories, and earnings."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg">
          <img
            src="/landing/why-choose.png"
            alt="Electrician working"
            className="h-[360px] w-full object-cover sm:h-[430px] lg:h-[470px]"
          />
        </div>
      </div>
    </section>
  )
}

export function TopTalentsSection() {
  const scrollingTalents = [...talents, ...talents, ...talents]

  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl overflow-hidden">
        <h2 className="text-center text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Meet Our Top Talents
        </h2>

        <div className="relative mt-14 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

          <div className="flex w-max animate-talent-scroll gap-7 hover:[animation-play-state:paused]">
            {scrollingTalents.map((talent, index) => (
              <div
                key={`${talent.name}-${index}`}
                className="w-[220px] shrink-0 rounded-md border border-slate-100 bg-white p-3 shadow-sm sm:w-[240px]"
              >
                <div className="overflow-hidden rounded">
                  <img
                    src={talent.image}
                    alt={talent.name}
                    className="h-44 w-full object-cover"
                  />
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-medium text-slate-950">
                    {talent.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{talent.role}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-yellow-400">★★★★★</span>
                    <Link
                      href="/search"
                      className="text-xs font-medium text-primary"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FindTalentsSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Find talents for your needs
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
            Explore a wide range of skilled talents at your finger tips to help
            solve personal or professional problems.
          </p>

          <div className="mt-12 space-y-10">
            <FeatureItem
              icon={Search}
              title="Browse with ease"
              description="Explore a diverse range of skilled talents across various fields. From home services to tech services and more. Find the perfect match for your needs."
            />

            <FeatureItem
              icon={CalendarCheck}
              title="Easy booking"
              description="Schedule appointments at your convenience. Our seamless booking system ensures a hassle-free experience."
            />

            <FeatureItem
              icon={Headphones}
              title="Customer support"
              description="Our dedicated support team is always here to assist you. Your satisfaction is our priority."
            />
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/post-job"
              className="inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-sm font-medium text-white"
            >
              Post a job
            </Link>

            <Link
              href="/search"
              className="inline-flex h-10 items-center justify-center rounded border border-primary/30 px-5 text-sm font-medium text-primary"
            >
              Find talents
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-20 left-16 hidden text-primary lg:block">
            <svg width="150" height="135" viewBox="0 0 150 135" fill="none">
              <path
                d="M3 26C42 5 103 19 119 54C139 96 86 111 68 83C52 59 85 35 119 62C134 74 140 91 142 106"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M128 96L143 110L148 90"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="overflow-hidden rounded-lg">
            <img
              src="/landing/find-talents.png"
              alt="Talent using phone"
              className="h-[360px] w-full object-cover sm:h-[430px] lg:h-[470px]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ShowcaseTalentSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Showcase your talent
            </h2>
            
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
              Powerful, self-serve product and growth analytics to help you
              convert, engage, and retain more users. Trusted by over 4,000
              startups.
            </p>
          </div>

          <div className="space-y-9">
            <MiniStep
              icon={UserRoundPlus}
              title="Create your profile"
              description="Create a professional profile highlighting your skills and services. Let your work speak for itself."
            />

            <MiniStep
              icon={TrendingUp}
              title="Reach more customers"
              description="Tap into a vast network of potential clients. Brikcell connects you with customers actively seeking your expertise."
            />

            <MiniStep
              icon={Settings}
              title="Manage your business"
              description="Our platform provides the tools to manage appointments, track earnings, and receive customer reviews."
            />

            <Link
              href="/auth/signup"
              className="inline-flex h-10 items-center justify-center rounded border border-primary/30 px-5 text-sm font-medium text-primary"
            >
              View artisans
            </Link>
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-sm">
          <img
            src="/landing/showcase-talent.png"
            alt="Talent using dashboard"
            className="h-[300px] w-full object-cover sm:h-[420px] lg:h-[480px]"
          />
        </div>
      </div>
    </section>
  )
}

export function ReadyToStartSection() {
  return (
    <section className="bg-[#090f1c] px-5 py-16 sm:px-8 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid overflow-hidden rounded-xl bg-[#121927] lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Ready to Get Started?
            </h2>

            <p className="mt-4 text-sm text-white/50">
              Join thousands of satisfied customers and talents today.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex h-10 items-center justify-center rounded border border-white/10 px-5 text-sm font-medium text-white"
              >
                Find an artisan
              </Link>

              <Link
                href="/auth/signup"
                className="inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-sm font-medium text-white"
              >
                Join as an artisan
              </Link>
            </div>
          </div>

          <div className="h-[260px] lg:h-[330px]">
            <img
              src="/landing/ready-cta.png"
              alt="Happy artisan"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="bg-white px-5 py-10 sm:px-8 lg:px-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[11px] font-bold text-white">
            B
          </span>
          <span className="text-base font-semibold text-slate-950">
            Brikcell
          </span>
        </Link>

        <div className="flex w-full max-w-sm gap-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="h-10 flex-1 rounded border border-slate-200 px-4 text-sm outline-none focus:border-primary"
          />

          <button className="h-10 rounded bg-primary px-5 text-sm font-medium text-white">
            Join wait list
          </button>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl text-center text-xs text-slate-500">
        © 2024 All rights reserved.
      </div>
    </footer>
  )
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="max-w-[420px]">
      <FigmaIcon Icon={Icon} />

      <h3 className="mt-5 text-base font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

function MiniStep({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="max-w-[460px]">
      <FigmaIcon Icon={Icon} />

      <h3 className="mt-5 text-base font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

function FigmaIcon({ Icon }: { Icon: React.ElementType }) {
  return (
    <div className="relative h-[58px] w-[58px]">
      <div className="absolute left-1 top-2 h-12 w-12 rotate-[10deg] rounded-xl bg-primary/70 shadow-[0_16px_28px_rgba(178,54,220,0.22)]" />

      <div className="absolute left-0 top-0 h-12 w-12 rounded-xl bg-primary shadow-[0_14px_30px_rgba(178,54,220,0.22)]">
        <div className="absolute -left-3 bottom-0 h-8 w-8 rounded-full bg-primary/20 blur-xl" />
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}