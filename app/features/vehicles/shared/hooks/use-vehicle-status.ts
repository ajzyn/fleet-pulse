import type { Vehicle } from "@db/schema";
import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useDisclosure } from "~/hooks/use-disclosure";
import { ActionErrorKind, INTENT_FIELD } from "~/lib/server/action";
import { VEHICLES_INTENT } from "../server/intents";
import type { handleUpdateStatus } from "../server/update-status.action.server";
import { getStatusLabel } from "../utils/status-presentation";

export const useStatusCell = (vehicle: Vehicle) => {
  const fetcher = useFetcher<typeof handleUpdateStatus>({ key: `vehicle-status-${vehicle.id}` });
  const retireDialog = useDisclosure();
  const revalidator = useRevalidator();

  const optimisticStatus =
    (fetcher.formData?.get("status") as Vehicle["status"] | null) ?? vehicle.status;
  const isPending = fetcher.state !== "idle";

  const submit = (status: Vehicle["status"]) => {
    void fetcher.submit(
      {
        [INTENT_FIELD]: VEHICLES_INTENT.updateStatus,
        id: vehicle.id,
        status,
        updatedAt: vehicle.updatedAt.toISOString(),
      },
      { method: "post" },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      toast.success("Status zaktualizowany");
      return;
    }

    if (fetcher.data.kind === ActionErrorKind.Conflict) {
      const { current } = fetcher.data.payload;
      toast.error(`${vehicle.plateNumber}: status to teraz "${getStatusLabel(current.status)}"`, {
        description: "Zmienione przez kogoś innego. Odśwież, aby kontynuować.",
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
      return;
    }

    toast.error("Nie udało się zaktualizować statusu");
  }, [fetcher.data, vehicle.plateNumber, revalidator]);

  const handleSelect = (status: Vehicle["status"]) => {
    if (status === vehicle.status) return;
    if (status === "retired") {
      retireDialog.onOpen();
      return;
    }
    submit(status);
  };

  const handleConfirmRetire = () => {
    submit("retired");
    retireDialog.onClose();
  };

  return {
    optimisticStatus,
    isPending,
    retireDialog,
    handleSelect,
    handleConfirmRetire,
  };
};
