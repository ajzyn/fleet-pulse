import type { Vehicle } from "@db/schema";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Badge, Flex } from "@radix-ui/themes";
import { DropdownMenu } from "radix-ui";
import { DropdownMenuContent } from "~/components/dropdown-menu/content";
import { ConfirmDialog } from "~/components/feedback/confirm-dialog";
import { useStatusCell } from "../hooks/use-vehicle-status";
import { getStatusLabel, statusColor, STATUSES } from "../utils/status-presentation";

interface VehicleStatusCellProps {
  vehicle: Vehicle;
}

export function VehicleStatusCell({ vehicle }: VehicleStatusCellProps) {
  const { handleConfirmRetire, retireDialog, optimisticStatus, isPending, handleSelect } =
    useStatusCell(vehicle);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Flex gap="2" align="center" className="cursor-pointer">
            <Badge
              color={statusColor[optimisticStatus]}
              variant="soft"
              className="inline-flex items-center gap-1"
            >
              {getStatusLabel(optimisticStatus)}
            </Badge>
            <Pencil1Icon width="12" height="12" aria-hidden />
          </Flex>
        </DropdownMenu.Trigger>

        <DropdownMenuContent>
          {STATUSES.map((status) => (
            <DropdownMenu.Item
              key={status}
              disabled={status === optimisticStatus || isPending}
              onSelect={() => {
                handleSelect(status);
              }}
              className="rt-reset rt-BaseMenuItem rt-DropdownMenuItem"
            >
              {getStatusLabel(status)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenuContent>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={retireDialog.open}
        onOpenChange={retireDialog.onOpenChange}
        onConfirm={handleConfirmRetire}
        title="Retire this vehicle?"
        description="Retired vehicles can't take trips or be assigned to drivers. You can reactivate them later."
        confirmLabel="Retire"
      />
    </>
  );
}
