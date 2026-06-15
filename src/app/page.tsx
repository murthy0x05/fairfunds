import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FairFundsWordmark } from "@/components/icons";
import {
  ArrowRight,
  Receipt,
  Users,
  Shield,
  BarChart3,
  FileSearch,
  Coins,
  CheckCircle,
  Zap,
  TrendingUp,
  ArrowRightLeft,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ─── Top Nav ─── */}
      <nav
        className="flex items-center justify-between px-6 lg:px-8 h-16 max-w-[1200px] mx-auto"
        id="top-nav"
      >
        <FairFundsWordmark />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero Section — Two Column ─── */}
      <header className="max-w-[1200px] mx-auto px-6 lg:px-8 pt-16 pb-24" id="hero">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card text-[13px] text-muted mb-6">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Open-source expense splitting
            </div>

            <h1 className="text-display-xl mb-5">
              Every rupee,
              <br />
              fully explained.
            </h1>

            <p className="text-body-md text-body max-w-md mb-8 leading-relaxed">
              Shared expenses without the guesswork. Import CSV data, detect
              anomalies, track multi-currency costs, and see exactly how every
              balance is calculated.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <Link href="/register">
                <Button size="lg">
                  Start Splitting <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-[13px] text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                Self-hostable
              </span>
            </div>
          </div>

          {/* Right: Product Preview Card */}
          <div className="hidden lg:block">
            <div className="bg-surface-dark rounded-xl p-6 shadow-dropdown">
              {/* Mock dashboard top bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="text-[11px] text-on-dark-soft ml-2 font-mono">
                  fairfunds.app/dashboard
                </span>
              </div>

              {/* Mini overview cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "TOTAL SPENT", value: "₹1,47,350", color: "text-on-dark" },
                  { label: "YOU OWE", value: "₹12,480", color: "text-error" },
                  { label: "YOU'RE OWED", value: "₹8,200", color: "text-success" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surface-dark-elevated rounded-lg p-3"
                  >
                    <p className="text-[9px] font-medium text-on-dark-soft tracking-[1.5px] uppercase mb-1.5">
                      {stat.label}
                    </p>
                    <p
                      className={`text-[18px] tabular-nums ${stat.color}`}
                      style={{
                        fontFamily: "var(--font-serif)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mini expense rows */}
              <div className="space-y-1">
                {[
                  {
                    name: "Groceries DMart",
                    by: "Sam",
                    amount: "₹1,990",
                    date: "Jun 15",
                  },
                  {
                    name: "Electricity Apr",
                    by: "Aisha",
                    amount: "₹1,380",
                    date: "Jun 14",
                  },
                  {
                    name: "Maid salary Apr",
                    by: "Priya",
                    amount: "₹3,000",
                    date: "Jun 13",
                  },
                  {
                    name: "Internet bill",
                    by: "Sam",
                    amount: "₹999",
                    date: "Jun 12",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-dark-soft/50 hover:bg-surface-dark-elevated transition-colors-fast"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-surface-dark-elevated flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-on-dark">
                          {row.name}
                        </p>
                        <p className="text-[11px] text-on-dark-soft">
                          {row.by} · {row.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-[13px] font-medium text-on-dark tabular-nums">
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="mt-4 pt-4 border-t border-on-dark-soft/15 flex items-center justify-between">
                <span className="text-[11px] text-on-dark-soft">
                  4 expenses · 3 members
                </span>
                <span className="text-[11px] text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  All balances verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Social Proof Strip ─── */}
      <section className="border-y border-hairline bg-surface-soft py-10 px-6 lg:px-8" id="social-proof">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "14", label: "Anomaly detectors", icon: Shield },
              { value: "4", label: "Split types", icon: ArrowRightLeft },
              { value: "160+", label: "Currencies supported", icon: Globe },
              { value: "100%", label: "Balance explainability", icon: BarChart3 },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5">
                <stat.icon className="w-5 h-5 text-primary mb-1" />
                <p
                  className="text-[32px] text-ink"
                  style={{
                    fontFamily: "var(--font-serif)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-[13px] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Grid ─── */}
      <section className="py-24 px-6 lg:px-8" id="features">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-caption-upper text-primary mb-3">FEATURES</p>
            <h2 className="text-display-md mb-3">
              Built for real-world complexity
            </h2>
            <p className="text-body-md text-muted max-w-lg mx-auto">
              Not just another expense splitter. FairFunds handles partial
              memberships, mixed currencies, and dirty data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: FileSearch,
                title: "Smart CSV Import",
                desc: "14 anomaly detectors catch duplicates, missing data, and format issues. Nothing is silently modified.",
              },
              {
                icon: Users,
                title: "Temporal Memberships",
                desc: "Moved in mid-April? You're only charged for expenses after your join date. Fair, automatic, verifiable.",
              },
              {
                icon: Coins,
                title: "Multi-Currency",
                desc: "USD and INR in the same group. Historical daily exchange rates from ECB, cached and traceable.",
              },
              {
                icon: BarChart3,
                title: "Explainable Balances",
                desc: "Click any balance and see the full derivation — every expense, split, and conversion.",
              },
              {
                icon: Receipt,
                title: "4 Split Types",
                desc: "Equal, unequal, percentage, and ratio splits. Remainder is assigned deterministically.",
              },
              {
                icon: Shield,
                title: "Full Audit Trail",
                desc: "Every change is logged with before/after diffs. See who changed what and when.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-surface-card rounded-lg p-8 flex flex-col gap-3 hover:bg-surface-cream-strong transition-colors-fast"
                id={`feature-${i}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-title-sm text-ink">{feature.title}</h3>
                <p className="text-body-sm text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6 lg:px-8 bg-surface-soft" id="how-it-works">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-caption-upper text-primary mb-3">HOW IT WORKS</p>
            <h2 className="text-display-md mb-3">Three steps to fairness</h2>
            <p className="text-body-md text-muted max-w-lg mx-auto">
              From messy CSV to verified balances in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create a group",
                desc: "Add members, set the default currency, and invite your flatmates or travel companions.",
                icon: Users,
              },
              {
                step: "02",
                title: "Import or add expenses",
                desc: "Drag & drop a CSV or manually add expenses. Our 14 detectors flag anomalies before they become problems.",
                icon: FileSearch,
              },
              {
                step: "03",
                title: "Verify & settle",
                desc: "Every balance comes with a mathematical derivation proof. Click 'Explain' to trace every rupee.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-canvas rounded-xl p-8 border border-hairline h-full">
                  <span
                    className="text-[48px] text-hairline-soft block mb-4"
                    style={{
                      fontFamily: "var(--font-serif)",
                      lineHeight: 1,
                      letterSpacing: "-1px",
                    }}
                  >
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-title-md text-ink mb-2">{item.title}</h3>
                  <p className="text-body-sm text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Explainability Showcase ─── */}
      <section className="py-24 px-6 lg:px-8" id="explainability">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Dark code-window style preview */}
            <div className="bg-surface-dark rounded-xl p-6 shadow-dropdown">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-medium text-on-dark">
                  Balance Derivation Proof
                </span>
              </div>

              {/* Formula display */}
              <div className="bg-surface-dark-elevated rounded-lg p-4 mb-4">
                <p className="text-[11px] text-on-dark-soft font-mono mb-2">
                  Net = Paid − Owed − Settled Out + Settled In
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[14px] font-mono tabular-nums">
                  <span className="text-success">₹12,000</span>
                  <span className="text-on-dark-soft">−</span>
                  <span className="text-error">₹8,450</span>
                  <span className="text-on-dark-soft">−</span>
                  <span className="text-accent-amber">₹0</span>
                  <span className="text-on-dark-soft">+</span>
                  <span className="text-accent-teal">₹0</span>
                  <span className="text-on-dark-soft">=</span>
                  <span className="text-success font-medium">+₹3,550</span>
                  <span className="text-success text-[11px] ml-1">✓ Verified</span>
                </div>
              </div>

              {/* Waterfall entries */}
              <div className="space-y-2">
                {[
                  { date: "Jun 15", desc: "Groceries DMart", amount: "+₹1,990", tag: "Credit", color: "text-success" },
                  { date: "Jun 14", desc: "Electricity Apr", amount: "−₹345", tag: "Debit", color: "text-error" },
                  { date: "Jun 13", desc: "Maid salary Apr", amount: "−₹750", tag: "Debit", color: "text-error" },
                  { date: "Jun 12", desc: "Furniture for common room", amount: "+₹12,000", tag: "Credit", color: "text-success" },
                ].map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-dark-soft/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-on-dark-soft w-12">
                        {entry.date}
                      </span>
                      <span className="text-[13px] text-on-dark">
                        {entry.desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-dark-elevated text-on-dark-soft">
                        {entry.tag}
                      </span>
                      <span className={`text-[13px] font-medium tabular-nums ${entry.color}`}>
                        {entry.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Copy */}
            <div>
              <p className="text-caption-upper text-primary mb-3">
                TRANSPARENCY
              </p>
              <h2 className="text-display-md mb-4">
                Every balance tells a story
              </h2>
              <p className="text-body-md text-muted mb-6 leading-relaxed">
                No more &ldquo;trust me, the math checks out.&rdquo; FairFunds
                generates a mathematical derivation proof for every member&apos;s
                balance — a chronological waterfall of every expense, split, and
                settlement.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Click any balance → instant derivation proof",
                  "Currency conversions show ECB rate + date",
                  "Split math verified: sum of shares = total",
                  "Full audit trail with before/after diffs",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] text-body">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button size="lg">
                  Try it yourself <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─── */}
      <section className="px-6 lg:px-8 pb-24" id="cta">
        <div className="max-w-[1200px] mx-auto bg-primary rounded-xl px-8 py-16 md:px-16 md:py-20 text-center">
          <h2
            className="text-display-sm mb-3"
            style={{ color: "var(--on-primary)", fontFamily: "var(--font-serif)" }}
          >
            Start splitting expenses fairly
          </h2>
          <p className="text-[16px] mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Import your data, verify every balance, and settle up with confidence.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Try FairFunds Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-surface-dark py-12 px-6 lg:px-8" id="footer">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <FairFundsWordmark variant="light" logoSize={24} />
            <div className="flex items-center gap-6 text-[13px] text-on-dark-soft">
              <span>Open Source</span>
              <span className="text-on-dark-soft/30">·</span>
              <span>Self-Hostable</span>
              <span className="text-on-dark-soft/30">·</span>
              <span>© 2026 FairFunds</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
