import type { KpiCardConfig } from "../types";
import { KpiCard } from "./kpi-card";

interface HeroKPIsProps {
  configs: KpiCardConfig[];
}

export function HeroKPIs({ configs }: HeroKPIsProps) {
  return (
    <section aria-label="Kluczowe wskaźniki floty">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 scroll-px-4 pb-1 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none">
        {configs.map((config) => (
          <div key={config.key} className="snap-start shrink-0 w-[80%] sm:w-[55%] md:w-auto grid">
            <KpiCard title={config.title} href={config.href} state={config.state} />
          </div>
        ))}
      </div>
    </section>
  );
}
