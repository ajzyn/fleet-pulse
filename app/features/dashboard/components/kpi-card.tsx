import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import type { MouseEvent } from "react";
import { Link } from "react-router";
import type { KPICardState } from "../types";
import { DeltaBadge } from "./delta-badge";

interface KPICardProps {
  title: string;
  href: string;
  state: KPICardState;
}

const CARD_MIN_HEIGHT = "140px";
const SPARKLINE_SLOT_HEIGHT = "32px";

export function KpiCard({ title, href, state }: KPICardProps) {
  const inner = <KpiCardInner title={title} state={state} />;

  return (
    <Card asChild size="2" className="transition-shadow hover:shadow-md">
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
    <Flex direction="column" gap="2" minHeight={CARD_MIN_HEIGHT}>
      <Text as="p" size="2" color="gray" weight="medium">
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
    <Flex direction="column" gap="2" flexGrow="1">
      <Heading as="h3" size="6" weight="bold">
        {state.value}
      </Heading>
      {state.subtitle ? (
        <Text size="1" color="gray">
          {state.subtitle}
        </Text>
      ) : null}
      <Flex
        justify={state.delta && state.sparkline ? "between" : "end"}
        align="end"
        gap="2"
        mt="auto"
        height={SPARKLINE_SLOT_HEIGHT}
      >
        {state.delta ? <DeltaBadge {...state.delta} /> : null}
      </Flex>
    </Flex>
  );
}
