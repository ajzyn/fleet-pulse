import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout } from "@radix-ui/themes";
import { isRouteErrorResponse, useRevalidator } from "react-router";

interface Props {
  error: unknown;
  resourceLabel?: string;
}

export function RouteErrorFallback({ error, resourceLabel = "data" }: Props) {
  const revalidator = useRevalidator();
  const isHttp = isRouteErrorResponse(error);
  const canRetry = !isHttp || error.status >= 500;

  return (
    <Callout.Root color="red" role="alert">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text className="flex gap-2 items-center">
        {isHttp
          ? `${error.status.toString()} ${error.statusText}`
          : `Failed to load ${resourceLabel}.`}
        {canRetry && (
          <Button
            disabled={revalidator.state === "loading"}
            onClick={() => void revalidator.revalidate()}
          >
            Retry
          </Button>
        )}
      </Callout.Text>
    </Callout.Root>
  );
}
