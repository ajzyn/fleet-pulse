import { Grid } from "@radix-ui/themes";
import type { KpiCardConfig } from "../types";
import { KpiCard } from "./kpi-card";

interface HeroKPIsProps {
  configs: KpiCardConfig[];
}

export function HeroKPIs({ configs }: HeroKPIsProps) {
  return (
    <section aria-label="Kluczowe wskaźniki floty">
      <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
        {configs.map((config) => (
          <KpiCard key={config.key} title={config.title} href={config.href} state={config.state} />
        ))}
      </Grid>
    </section>
  );
}
