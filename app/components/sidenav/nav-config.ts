import { DashboardIcon, GridIcon, PersonIcon, GearIcon, BarChartIcon } from "@radix-ui/react-icons";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

export interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: DashboardIcon, exact: true },
  { to: "/vehicles", label: "Vehicles", icon: GridIcon },
  { to: "/drivers", label: "Drivers", icon: PersonIcon },
  { to: "/maintenance", label: "Maintenance", icon: GearIcon },
  { to: "/costs", label: "Costs", icon: BarChartIcon },
];
