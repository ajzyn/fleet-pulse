import { Button, Flex, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface ErrorRowProps {
  hasError: boolean;
  onRetry: () => void;
  message?: ReactNode;
  retryLabel?: ReactNode;
}

export function ErrorRow({
  hasError,
  onRetry,
  message = "Failed to load",
  retryLabel = "Try again",
}: ErrorRowProps) {
  if (!hasError) return null;
  return (
    <Flex justify="center" py="4" gap="2" align="center">
      <Text color="red" size="2">
        {message}
      </Text>
      <Button variant="ghost" size="2" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Flex>
  );
}
