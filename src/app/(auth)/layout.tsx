import { FairFundsWordmark } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-[400px] px-6">
        <div className="flex items-center mb-10">
          <FairFundsWordmark logoSize={28} />
        </div>
        {children}
      </div>
    </div>
  );
}
