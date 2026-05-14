import { useCallback, useState } from "react";

export const useDisclosure = (initial = false) => {
  const [open, setOpen] = useState(initial);

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return {
    open,
    onOpen,
    onClose,
    toggle,
    onOpenChange: setOpen,
  };
};
