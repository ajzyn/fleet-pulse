import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

export type DataViewState<TData> =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string }
  | ({ status: "success" } & TData);

interface DataViewProps<TData> {
  state: DataViewState<TData>;
  loading: ReactNode;
  children: (data: TData) => ReactNode;
  className?: string;
  emptyExtra?: ReactNode;
}

export function DataView<TData>({
  state,
  loading,
  children,
  className,
  emptyExtra,
}: DataViewProps<TData>) {
  if (state.status === "loading") {
    return <>{loading}</>;
  }

  if (state.status === "error") {
    return (
      <Box className={className}>
        <Flex direction="column" gap="3" align="start" justify="center" height="100%">
          <Flex gap="2" align="center">
            <ExclamationTriangleIcon color="red" />
            <Text size="2" color="red">
              {state.message}
            </Text>
          </Flex>
          <Button size="2" variant="soft" onClick={() => void state.onRetry()}>
            Spróbuj ponownie
          </Button>
        </Flex>
      </Box>
    );
  }

  if (state.status === "empty") {
    return (
      <Box className={className}>
        <Flex direction="column" gap="2" align="start" justify="center" height="100%">
          <Flex gap="2" align="center">
            <InfoCircledIcon color="gray" />
            <Text size="2" color="gray">
              {state.reason}
            </Text>
          </Flex>
          {emptyExtra}
        </Flex>
      </Box>
    );
  }

  return <>{children(state)}</>;
}
