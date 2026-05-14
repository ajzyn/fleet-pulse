import { Badge, Box, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Drawer } from "~/components/drawer";
import { useDisclosure } from "~/hooks/use-disclosure";
import type { useVehiclesFilters } from "../hooks/use-vehicles-filters";
import { VehicleFilterFields } from "./vehicles-filter-fields";

type VehiclesFiltersProps = ReturnType<typeof useVehiclesFilters>;

export function VehiclesFilters({ q, status, fuel, activeCount, onChange }: VehiclesFiltersProps) {
  const drawer = useDisclosure();

  return (
    <Flex gap="3" wrap="wrap" align="end" mb="4">
      <Flex direction="column" gap="1" flexGrow="1" minWidth="200px" maxWidth="600px">
        <Text as="label" size="2" htmlFor="filter-q" color="gray">
          Search
        </Text>
        <TextField.Root
          id="filter-q"
          type="search"
          placeholder="Plate, VIN, make…"
          className="w-full"
          value={q}
          onChange={(e) => {
            onChange("q", e.target.value || undefined);
          }}
        />
      </Flex>

      <Flex display={{ initial: "none", md: "flex" }} gap="3">
        <VehicleFilterFields status={status} fuel={fuel} onChange={onChange} />
      </Flex>
      <Box display={{ initial: "block", md: "none" }}>
        <Button variant="soft" color="gray" onClick={drawer.onOpen}>
          Filters
          {activeCount > 0 && <Badge>{activeCount}</Badge>}
        </Button>
      </Box>
      <Drawer.Root side="bottom" size="sm" open={drawer.open} onOpenChange={drawer.onOpenChange}>
        <Drawer.Header>
          <Drawer.Title>Filters</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Flex direction="column" gap="5" maxWidth="500px">
            <VehicleFilterFields status={status} fuel={fuel} onChange={onChange} />
          </Flex>
        </Drawer.Body>
      </Drawer.Root>
    </Flex>
  );
}
