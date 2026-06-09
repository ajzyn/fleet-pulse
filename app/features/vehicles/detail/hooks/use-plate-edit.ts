import type { Vehicle } from "@db/schema";
import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";
import { VEHICLES_INTENT } from "~/features/vehicles/shared/server/intents";
import { useDisclosure } from "~/hooks/use-disclosure";
import { ActionErrorKind, INTENT_FIELD } from "~/lib/server/action";
import type { handleUpdatePlate } from "../server/update-plate.action.server";

export const usePlateEdit = (vehicle: Vehicle) => {
  const fetcher = useFetcher<typeof handleUpdatePlate>({ key: `vehicle-plate-${vehicle.id}` });
  const { open: editing, onOpen, onClose } = useDisclosure();
  const revalidator = useRevalidator();

  const isPending = fetcher.state !== "idle";
  const optimisticPlate =
    (fetcher.formData?.get("plateNumber") as string | null) ?? vehicle.plateNumber;

  const fieldError =
    fetcher.data && !fetcher.data.ok && fetcher.data.kind === ActionErrorKind.Validation
      ? fetcher.data.payload.plateNumber?.[0]
      : undefined;

  const submit = (plateNumber: string) => {
    void fetcher.submit(
      {
        [INTENT_FIELD]: VEHICLES_INTENT.updatePlate,
        id: vehicle.id,
        plateNumber,
        updatedAt: vehicle.updatedAt.toISOString(),
      },
      { method: "post" },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      toast.success("Tablica zaktualizowana");
      onClose();
      return;
    }

    if (fetcher.data.kind === ActionErrorKind.Conflict) {
      toast.error(`${vehicle.plateNumber}: pojazd zmieniony w innym miejscu`, {
        description: "Odśwież, aby kontynuować.",
        duration: Infinity,
        action: {
          label: "Odśwież",
          onClick: () => {
            void revalidator.revalidate();
          },
        },
      });
      return;
    }

    if (fetcher.data.kind === ActionErrorKind.NotFound) {
      toast.error("Pojazd już nie istnieje");
    }
  }, [fetcher.data, vehicle.plateNumber, revalidator, onClose]);

  return {
    editing,
    onEdit: onOpen,
    onCancel: onClose,
    submit,
    isPending,
    fieldError,
    optimisticPlate,
  };
};
