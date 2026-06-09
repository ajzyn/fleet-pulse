import type { Vehicle } from "@db/schema";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Badge, Button } from "@radix-ui/themes";
import { DropdownMenu } from "radix-ui";
import { DropdownMenuContent } from "~/components/dropdown-menu/content";
import { ConfirmDialog } from "~/components/feedback/confirm-dialog";
import { useStatusCell } from "../hooks/use-vehicle-status";
import { getStatusLabel, statusColor, STATUSES } from "../utils/status-presentation";

type StatusCellSize = "1" | "2" | "3";

const ICON_SIZE: Record<StatusCellSize, string> = { "1": "12", "2": "14", "3": "16" };

interface VehicleStatusCellProps {
  vehicle: Vehicle;
  size?: StatusCellSize;
}

export function VehicleStatusCell({ vehicle, size }: VehicleStatusCellProps) {
  const { handleConfirmRetire, retireDialog, optimisticStatus, isPending, handleSelect } =
    useStatusCell(vehicle);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            {...(size && { size })}
            variant="ghost"
            color="gray"
            className="cursor-pointer"
            aria-label={`Change status (current: ${getStatusLabel(optimisticStatus)})`}
          >
            <Badge
              {...(size && { size })}
              color={statusColor[optimisticStatus]}
              variant="soft"
              className="inline-flex items-center gap-1"
            >
              {getStatusLabel(optimisticStatus)}
            </Badge>
            <Pencil1Icon
              width={size ? ICON_SIZE[size] : "12"}
              height={size ? ICON_SIZE[size] : "12"}
              aria-hidden
            />
          </Button>
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
