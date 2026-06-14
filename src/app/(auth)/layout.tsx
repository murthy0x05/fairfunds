import { Coins } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center gap-2 mb-8">
          <Coins className="w-5 h-5 text-primary" />
          <span className="text-base font-semibold">FairFunds</span>
        </div>
        {children}
      </div>
    </div>
  );
}
