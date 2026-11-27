import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  price: string;
  features: string[];
}

export function PaymentPlanCards({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div key={plan.name} className="p-6 border rounded-xl bg-card shadow-sm flex flex-col gap-4 border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
          <p className="text-3xl font-extrabold text-blue-600">{plan.price}</p>
          <ul className="flex-1 space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-500" /> {f}
              </li>
            ))}
          </ul>
          <Button className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B]">
            Select Plan
          </Button>
        </div>
      ))}
    </div>
  );
}
