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
      <header className="border-b border-border">
        <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-base font-semibold">FairFunds</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pt-24 pb-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 text-foreground">
            Every rupee,{" "}
            <span className="text-primary">fully explained.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Shared expenses without the guesswork. Import CSV data, detect
            anomalies, track multi-currency costs, and see exactly how every
            balance is calculated.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Start Splitting <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">
              Built for real-world complexity
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Not just another expense splitter. FairFunds handles partial
              memberships, mixed currencies, and dirty data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {[
              {
                icon: FileSearch,
                title: "Smart CSV Import",
                desc: "14 anomaly detectors catch duplicates, missing data, and format issues. Nothing is silently modified.",
              },
              {
                icon: Users,
                title: "Temporal Memberships",
                desc: "Moved in mid-April? You're only charged for expenses after your join date.",
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
                className="bg-card p-6"
              >
                <feature.icon className="w-4 h-4 text-primary mb-3" />
                <h3 className="font-medium text-sm mb-1.5">{feature.title}</h3>
                <p className="text-[var(--color-tertiary)] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--color-tertiary)]">
          <span>FairFunds</span>
          <span>Built for the FairFunds assignment</span>
        </div>
      </footer>
    </div>
  );
}
