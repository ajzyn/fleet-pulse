import { fuelType, vehicleStatus } from "@db/schema";
import { useDebouncedSearchParam } from "~/hooks/use-debounce";
import { usePendingSearchParams } from "~/hooks/use-pending-search-params";
import { useTableUrlParams } from "~/hooks/use-table-url-params";
import { createEnumGuard } from "~/lib/enum-guard";
import type { FilterKey } from "../types";

const isVehicleStatus = createEnumGuard(vehicleStatus.enumValues);
const isFuelType = createEnumGuard(fuelType.enumValues);

export const useVehiclesFilters = (currentQ: string) => {
  const { setFilter } = useTableUrlParams<FilterKey>();
  const [qDraft, setQDraft] = useDebouncedSearchParam("q", currentQ);
  const params = usePendingSearchParams();

  const statusRaw = params.get("status");
  const fuelRaw = params.get("fuelType");
  const status = statusRaw && isVehicleStatus(statusRaw) ? statusRaw : undefined;
  const fuel = fuelRaw && isFuelType(fuelRaw) ? fuelRaw : undefined;

  const onChange = (key: FilterKey, value: string | undefined) => {
    if (key === "q") {
      setQDraft(value ?? "");
      return;
    }
    setFilter(key, value);
  };

  return {
    q: qDraft,
    status,
    fuel,
    onChange,
    activeCount: [status, fuel].filter(Boolean).length,
  };
};
