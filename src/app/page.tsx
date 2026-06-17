import Image from "next/image";
import Link from "next/link";
import { HeaderAuth } from "@/features/auth/components/header-auth";
import { BeforeAfterShowcase } from "@/features/landing/components/before-after-slider";
import { Gallery } from "@/features/landing/components/gallery";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Gallery", href: "#gallery" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const STEPS = [
  {
    title: "Upload Your Car",
    description: "Upload a clear photo of your car.",
    icon: UploadIcon,
  },
  {
    title: "Choose & Customize",
    description: "Pick parts, colors, wheels and more.",
    icon: WrenchIcon,
  },
  {
    title: "Real-Time Preview",
    description: "See your car transform instantly in 3D.",
    icon: CubeIcon,
  },
  {
    title: "Save & Share",
    description: "Download high-quality images and show off.",
    icon: DownloadIcon,
  },
];

const FEATURES = [
  {
    title: "Thousands of Parts",
    description: "Wheels, body kits, spoilers, lights and more.",
    icon: WheelIcon,
  },
  {
    title: "Unlimited Colors",
    description: "Explore endless color combinations.",
    icon: PaletteIcon,
  },
  {
    title: "Realistic 3D Rendering",
    description: "Photorealistic quality with every detail.",
    icon: CubeIcon,
  },
  {
    title: "Save & Compare",
    description: "Save multiple builds and compare side by side.",
    icon: PhoneIcon,
  },
  {
    title: "Share with Community",
    description: "Get feedback and inspire others.",
    icon: ShareIcon,
  },
];

const BRANDS = ["WORK", "BBS", "APR", "RECARO", "ROHANA", "VORSTEINER"];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07060d] text-zinc-100">
      <BackgroundGlow />

      <Header />

      <main className="relative">
        <Hero />
        <HowItWorks />
        <Features />
        <GallerySection />
        <TrustedBy />
      </main>

      <Footer />
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="-top-40 -left-40 absolute h-[30rem] w-[30rem] rounded-full bg-violet-700/15 blur-[120px]" />
      <div className="-right-40 absolute top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-700/10 blur-[120px]" />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-white/5 border-b bg-[#07060d]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/assets/logo-01.png"
            alt="Garage AI"
            width={60}
            height={60}
            className="h-16 w-16"
          />
          <span className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight">
              GARAGE
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="mt-0.5 text-[9px] text-zinc-500 tracking-[0.25em]">
              CUSTOMIZE YOUR CAR YOUR WAY
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-4 lg:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-medium text-violet-300 text-xs tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          VISUALIZE YOUR DREAM CAR
        </span>

        <h1 className="mt-6 font-extrabold text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          Customize.
          <br />
          Visualize.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-violet-500 to-blue-400 bg-clip-text text-transparent">
            Perfect.
          </span>
        </h1>

        <p className="mt-6 max-w-md text-zinc-400 leading-relaxed">
          From deep-dish wheels and lowered suspension to widebody conversions,
          spoilers, splitters, diffusers, wraps, and race-inspired builds—upload
          your car and see your dream setup come to life before making a single
          modification.
        </p>

        <div className="mt-8 max-w-md rounded-2xl border border-violet-500/30 border-dashed bg-violet-500/5 p-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <UploadIcon className="h-8 w-8 text-violet-400" />
            <p className="mt-2 font-semibold text-base">Upload Your Car</p>
            <p className="text-xs text-zinc-500">JPG, PNG up to 20MB</p>
          </div>
          <Link
            href="/customize"
            className="group mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-2.5 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
          >
            Upload &amp; Start Customizing
            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[
              "from-violet-500 to-purple-600",
              "from-blue-500 to-cyan-500",
              "from-fuchsia-500 to-pink-600",
            ].map((gradient) => (
              <span
                key={gradient}
                className={`h-8 w-8 rounded-full border-2 border-[#07060d] bg-gradient-to-br ${gradient}`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Join 50,000+ car enthusiasts
            <br />
            already customizing their rides
          </p>
        </div>
      </div>

      <BeforeAfterShowcase />
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center font-semibold text-violet-400 text-xs tracking-[0.2em]">
      {children}
    </p>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 sm:p-12">
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="-top-2 -right-2 absolute flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-blue-500 font-bold text-[11px] text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-sm">{step.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <SectionLabel>POWERFUL FEATURES</SectionLabel>
      <h2 className="mt-3 text-center font-bold text-3xl tracking-tight sm:text-4xl">
        Everything you need to build
        <br className="hidden sm:block" /> your dream car
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 transition group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-sm">{feature.title}</h3>
              <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <SectionLabel>BUILT BY YOU</SectionLabel>
      <h2 className="mt-3 mb-10 text-center font-bold text-3xl tracking-tight sm:text-4xl">
        See what car enthusiasts are creating
      </h2>
      <Gallery />
    </section>
  );
}

function TrustedBy() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-center text-sm text-zinc-500">
        Trusted by car enthusiasts worldwide
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {BRANDS.map((brand) => (
          <span
            key={brand}
            className="font-bold text-lg text-zinc-600 tracking-widest transition hover:text-zinc-400"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-white/5 border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Image
            src="/assets/logo-01.png"
            alt="Garage AI"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-bold tracking-tight">
            GARAGE
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Garage AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

type IconProps = { className?: string };

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function UploadIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function WrenchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CubeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function DownloadIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function WheelIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6" />
      <path d="m18.5 8-5 3.5" />
      <path d="m18.5 16-5-3.5" />
      <path d="M5.5 8l5 3.5" />
      <path d="m5.5 16 5-3.5" />
    </svg>
  );
}

function PaletteIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}
