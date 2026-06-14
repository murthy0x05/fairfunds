import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Receipt,
  Users,
  Shield,
  BarChart3,
  FileSearch,
  Coins,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">FairFunds</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            Transparent & Explainable
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Every rupee,</span>
            <br />
            <span className="text-foreground">fully explained.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Shared expenses without the guesswork. Import CSV data, detect
            anomalies, track multi-currency costs, and see exactly how every
            balance is calculated.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Start Splitting <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Built for{" "}
              <span className="gradient-text">real-world complexity</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Not just another expense splitter. FairFunds handles the messy
              reality of shared living — partial memberships, mixed currencies,
              and dirty data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileSearch,
                title: "Smart CSV Import",
                desc: "14 anomaly detectors catch duplicates, missing data, and format issues. Nothing is silently modified.",
                color: "from-indigo-500 to-blue-500",
              },
              {
                icon: Users,
                title: "Temporal Memberships",
                desc: "Moved in mid-April? You're only charged for expenses after your join date. Fair, automatic, verifiable.",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Coins,
                title: "Multi-Currency",
                desc: "USD and INR in the same group. Historical daily exchange rates from ECB, cached and traceable.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: BarChart3,
                title: "Explainable Balances",
                desc: '"Why do I owe ₹2,347?" Click any balance and see the full derivation — every expense, split, and conversion.',
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: Receipt,
                title: "4 Split Types",
                desc: "Equal, unequal, percentage, and ratio splits. Remainder is assigned deterministically — no hidden rounding.",
                color: "from-rose-500 to-red-500",
              },
              {
                icon: Shield,
                title: "Full Audit Trail",
                desc: "Every change is logged with before/after diffs. See who changed what and when. Nothing disappears silently.",
                color: "from-cyan-500 to-blue-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card-hover p-6"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span>FairFunds</span>
          </div>
          <p>Built for the FairFunds assignment</p>
        </div>
      </footer>
    </div>
  );
}
