import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import type { MouseEvent } from "react";
import { Link } from "react-router";
import type { KPICardState } from "../types";
import { DeltaBadge } from "./delta-badge";
import { Sparkline } from "./sparkline";

interface KPICardProps {
  title: string;
  href: string;
  state: KPICardState;
}

const SPARKLINE_SLOT_HEIGHT = "32px";

export function KpiCard({ title, href, state }: KPICardProps) {
  const inner = <KpiCardInner title={title} state={state} />;

  return (
    <Card asChild size={{ initial: "1", md: "2" }} className="transition-shadow hover:shadow-md">
      <Link
        to={href}
        aria-label={title}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-9)] rounded-[inherit]"
      >
        {inner}
      </Link>
    </Card>
  );
}

function KpiCardInner({ title, state }: { title: string; state: KPICardState }) {
  return (
    <Flex direction="column" gap="1" height="100%">
      <Text as="p" size="1" color="gray" weight="medium" className="line-clamp-2 min-h-[2lh]">
        {title}
      </Text>
      <KpiCardContent state={state} />
    </Flex>
  );
}

function KpiCardContent({ state }: { state: KPICardState }) {
  if (state.status === "loading") {
    return (
      <Flex direction="column" gap="2">
        <Skeleton width="120px" height="32px" />
        <Skeleton width="80px" height="20px" />
        <Skeleton width="100%" height={SPARKLINE_SLOT_HEIGHT} />
      </Flex>
    );
  }

  if (state.status === "error") {
    const handleRetry = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      void state.onRetry();
    };
    return (
      <Flex direction="column" gap="2" align="start">
        <Flex gap="1" align="center">
          <ExclamationTriangleIcon color="red" />
          <Text size="2" color="red">
            {state.message}
          </Text>
        </Flex>
        <Button size="1" variant="soft" onClick={handleRetry}>
          Spróbuj ponownie
        </Button>
      </Flex>
    );
  }

  if (state.status === "empty") {
    return (
      <Flex direction="column" gap="1" align="start">
        <InfoCircledIcon color="gray" />
        <Text size="2" color="gray">
          {state.reason}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="1" flexGrow="1">
      <Heading as="h3" size={{ initial: "4", md: "6" }} weight="bold">
        {state.value}
      </Heading>
      <Text size="1" color="gray" className="min-h-[1lh] line-clamp-1">
        {state.subtitle ?? " "}
      </Text>
      {state.delta || state.sparkline ? (
        <Flex
          justify={state.delta && state.sparkline ? "between" : "end"}
          align="center"
          gap="2"
          {...(state.sparkline ? { height: SPARKLINE_SLOT_HEIGHT } : {})}
          mt="auto"
        >
          {state.delta ? <DeltaBadge {...state.delta} /> : null}
          {state.sparkline ? (
            <Box flexGrow="1" maxWidth="120px" height="100%">
              <Sparkline data={state.sparkline} />
            </Box>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  );
}
