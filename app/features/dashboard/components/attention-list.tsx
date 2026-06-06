import { ExclamationTriangleIcon, InfoCircledIcon, ReloadIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Text,
  type BadgeProps,
} from "@radix-ui/themes";
import { Link } from "react-router";
import { dateFormatter } from "~/lib/date-formatter";
import type { AttentionItemView, AttentionListState, ChipTone } from "../types";

const ROW_MIN_HEIGHT = "72px";
const SKELETON_ROWS = 5;
const VISIBLE_CHIPS = 2;
const MOBILE_VISIBLE_ROWS = 3;

const CHIP_COLOR: Record<ChipTone, NonNullable<BadgeProps["color"]>> = {
  critical: "red",
  warning: "orange",
  caution: "amber",
  info: "blue",
};

const STRIPE_CLASS: Record<ChipTone, string> = {
  critical: "border-l-[var(--red-9)]",
  warning: "border-l-[var(--orange-9)]",
  caution: "border-l-[var(--amber-9)]",
  info: "border-l-[var(--blue-9)]",
};

const STATUS_COLOR: Record<AttentionItemView["status"], NonNullable<BadgeProps["color"]>> = {
  active: "green",
  in_maintenance: "yellow",
};

const STATUS_LABEL: Record<AttentionItemView["status"], string> = {
  active: "Aktywny",
  in_maintenance: "W serwisie",
};

interface AttentionListProps {
  state: AttentionListState;
  generatedAt: string;
}

export function AttentionList({ state, generatedAt }: AttentionListProps) {
  const refreshHandler =
    state.status === "success" || state.status === "empty" ? state.onRefresh : null;

  return (
    <Card size="3" asChild>
      <section aria-label="Pojazdy wymagające uwagi">
        <Flex justify="between" align="center" mb="4" gap="3">
          <Heading as="h2" size="4">
            Wymaga uwagi
          </Heading>
          {refreshHandler ? (
            <IconButton
              variant="ghost"
              color="gray"
              onClick={() => void refreshHandler()}
              aria-label="Odśwież listę"
            >
              <ReloadIcon />
            </IconButton>
          ) : null}
        </Flex>
        <AttentionListContent state={state} generatedAt={generatedAt} />
      </section>
    </Card>
  );
}

function AttentionListContent({ state, generatedAt }: AttentionListProps) {
  if (state.status === "loading") {
    return (
      <Flex direction="column" gap="2" role="status" aria-label="Wczytuję listę pojazdów">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} width="100%" height={ROW_MIN_HEIGHT} />
        ))}
      </Flex>
    );
  }

  if (state.status === "error") {
    return (
      <Flex direction="column" gap="3" align="start" minHeight={ROW_MIN_HEIGHT} justify="center">
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
    );
  }

  if (state.status === "empty") {
    return (
      <Flex direction="column" gap="2" align="start" minHeight={ROW_MIN_HEIGHT} justify="center">
        <Flex gap="2" align="center">
          <InfoCircledIcon color="gray" />
          <Text size="2" color="gray">
            {state.reason}
          </Text>
        </Flex>
        <Text size="1" color="gray">
          Sprawdzono:
          <time dateTime={generatedAt}>{dateFormatter.format(new Date(generatedAt))}</time>
        </Text>
      </Flex>
    );
  }

  const showAllLink = state.hasOverflow || state.items.length > MOBILE_VISIBLE_ROWS;

  return (
    <Box>
      <ul className="list-none p-0 m-0">
        {state.items.map((item, index) => (
          <AttentionRow
            key={item.vehicleId}
            item={item}
            className={[
              index >= MOBILE_VISIBLE_ROWS ? "max-md:hidden" : "",
              index === MOBILE_VISIBLE_ROWS - 1 ? "max-md:border-b-0" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </ul>
      {showAllLink ? (
        <Box
          pt="3"
          mt="2"
          className={`border-t border-[var(--gray-a4)] ${state.hasOverflow ? "" : "md:hidden"}`}
        >
          <Link
            to="/vehicles?needs_attention=true"
            className="text-[var(--accent-11)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-9)] rounded-2"
          >
            <Text size="2">Zobacz wszystkie ({state.totalCount})</Text>
          </Link>
        </Box>
      ) : null}
    </Box>
  );
}

function AttentionRow({ item, className = "" }: { item: AttentionItemView; className?: string }) {
  const visibleChips = item.chips.slice(0, VISIBLE_CHIPS);
  const overflowCount = item.chips.length - visibleChips.length;

  return (
    <li className={`border-b border-[var(--gray-a3)] last:border-b-0 ${className}`}>
      <Link
        to={item.href}
        aria-label={`${item.plateNumber} — ${item.make} ${item.model}`}
        className={`block py-3 pl-3 pr-3 border-l-4 ${STRIPE_CLASS[item.topTone]} hover:bg-[var(--gray-a2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-9)] rounded-r-2`}
      >
        <Flex
          direction={{ initial: "column", sm: "row" }}
          gap="2"
          align={{ initial: "start", sm: "center" }}
          justify="between"
        >
          <Flex direction="column" gap="1" minWidth="0">
            <Flex gap="2" align="center" wrap="wrap">
              <Text weight="bold" size="3">
                {item.plateNumber}
              </Text>
              <Badge color={STATUS_COLOR[item.status]} variant="soft" radius="full" size="1">
                {STATUS_LABEL[item.status]}
              </Badge>
            </Flex>
            <Text size="2" color="gray">
              {item.make} {item.model}
            </Text>
          </Flex>
          <Flex gap="1" wrap="wrap" justify={{ initial: "start", sm: "end" }}>
            {visibleChips.map((chip) => (
              <Badge
                key={chip.kind}
                color={CHIP_COLOR[chip.tone]}
                variant="soft"
                radius="full"
                size="1"
              >
                {chip.label}
              </Badge>
            ))}
            {overflowCount > 0 ? (
              <Badge
                color="gray"
                variant="soft"
                radius="full"
                size="1"
                aria-label={`Dodatkowych alertów: ${overflowCount.toString()}`}
              >
                +{overflowCount}
              </Badge>
            ) : null}
          </Flex>
        </Flex>
      </Link>
    </li>
  );
}
