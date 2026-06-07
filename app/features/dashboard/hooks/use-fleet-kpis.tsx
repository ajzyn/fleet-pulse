import { useRevalidator } from "react-router";
import type { Route } from "../../../routes/dashboard/+types/route";
import type { KpiCardConfig, KPICardState } from "../types";

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type KPIsState = Route.ComponentProps["loaderData"]["kpis"];

export const useFleetKPIs = (kpisState: KPIsState): KpiCardConfig[] => {
  const { revalidate } = useRevalidator();

  if (kpisState.status === "error") {
    const errorState: KPICardState = {
      status: "error",
      message: kpisState.message,
      onRetry: revalidate,
    };
    return [
      {
        key: "availability",
        title: "Aktywne pojazdy",
        href: "/vehicles?status=active",
        state: errorState,
      },
      { key: "utilization", title: "Średni dzienny przebieg", href: "/costs", state: errorState },
      { key: "cost-per-km", title: "Koszt kilometra", href: "/costs", state: errorState },
      { key: "monthly-spend", title: "Wydatki w tym miesiącu", href: "/costs", state: errorState },
    ];
  }

  const { fleetAvailability, utilization, costPerKm, monthlySpend } = kpisState.data;

  return [
    {
      key: "availability",
      title: "Aktywne pojazdy",
      href: "/vehicles?status=active",
      state: {
        status: "success",
        value: `${integerFormatter.format(fleetAvailability.activeNow)} / ${integerFormatter.format(fleetAvailability.totalNonRetired)} aut`,
        delta: {
          value: fleetAvailability.delta.absolute,
          format: "absolute",
          unit: "aut",
          goodDirection: "up",
        },
        sparkline: fleetAvailability.sparkline,
      },
    },
    {
      key: "utilization",
      title: "Średni dzienny przebieg",
      href: "/costs",
      state: {
        status: "success",
        value: `${integerFormatter.format(utilization.kmPerDay)} km/dzień`,
        delta: {
          value: utilization.delta.percentage / 100,
          format: "percent",
          goodDirection: "up",
        },
        sparkline: utilization.sparkline,
      },
    },
    {
      key: "cost-per-km",
      title: "Koszt kilometra",
      href: "/costs",
      state: {
        status: "success",
        value: `${decimalFormatter.format(costPerKm.value)} zł/km`,
        delta: {
          value: costPerKm.delta.percentage / 100,
          format: "percent",
          goodDirection: "down",
        },
        sparkline: costPerKm.sparkline,
      },
    },
    {
      key: "monthly-spend",
      title: "Wydatki w tym miesiącu",
      href: "/costs",
      state: {
        status: "success",
        value: plnFormatter.format(monthlySpend.actualMtd),
        subtitle: `Prognoza: ${plnFormatter.format(monthlySpend.forecast)}`,
        delta: {
          value: monthlySpend.delta.percentage / 100,
          format: "percent",
          goodDirection: "down",
        },
        sparkline: monthlySpend.sparkline,
      },
    },
  ];
};
