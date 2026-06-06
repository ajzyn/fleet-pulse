export type CostBreakdownCategory = "fuel" | "maintenance_planned" | "maintenance_unplanned";

export interface CostBreakdownSlice {
  category: CostBreakdownCategory;
  amount: number;
  percentage: number;
}
