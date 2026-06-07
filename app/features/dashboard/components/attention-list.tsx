import { Badge, Box, Card, Flex, Heading, Skeleton, Text, type BadgeProps } from "@radix-ui/themes";
import { Link } from "react-router";
import { AsyncView } from "~/components/feedback/async-view";
import { dateFormatter } from "~/lib/date-formatter";
import type { AttentionItemView, AttentionListState, ChipTone } from "../types";

const ROW_MIN_HEIGHT = "72px";
const SKELETON_ROWS = 5;
const VISIBLE_CHIPS = 2;
const MOBILE_VISIBLE_ROWS = 3;
const DESKTOP_VISIBLE_ROWS = 8;

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
  return (
    <Card size="3" asChild>
      <section
        aria-label="Pojazdy wymagające uwagi"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Heading as="h2" size="4" mb="4">
          Wymaga uwagi
        </Heading>
        <AsyncView
          state={state}
          className="min-h-[72px]"
          loading={
            <Flex direction="column" gap="2" role="status" aria-label="Wczytuję listę pojazdów">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <Skeleton key={index} width="100%" height={ROW_MIN_HEIGHT} />
              ))}
            </Flex>
          }
          emptyExtra={
            <Text size="1" color="gray">
              Sprawdzono:
              <time dateTime={generatedAt}>{dateFormatter.format(new Date(generatedAt))}</time>
            </Text>
          }
        >
          {(data) => (
            <AttentionItems
              items={data.items}
              totalCount={data.totalCount}
              hasOverflow={data.hasOverflow}
            />
          )}
        </AsyncView>
      </section>
    </Card>
  );
}

function AttentionItems({
  items,
  totalCount,
  hasOverflow,
}: {
  items: AttentionItemView[];
  totalCount: number;
  hasOverflow: boolean;
}) {
  const showAllLink = hasOverflow || items.length > MOBILE_VISIBLE_ROWS;
  const desktopCapped = items.length > DESKTOP_VISIBLE_ROWS;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ul className="list-none p-0 m-0">
        {items.map((item, index) => (
          <AttentionRow
            key={item.vehicleId}
            item={item}
            className={[
              index >= MOBILE_VISIBLE_ROWS ? "max-md:hidden" : "",
              index === MOBILE_VISIBLE_ROWS - 1 ? "max-md:border-b-0" : "",
              index >= DESKTOP_VISIBLE_ROWS ? "xl:hidden" : "",
              index === DESKTOP_VISIBLE_ROWS - 1 ? "xl:border-b-0" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </ul>
      {showAllLink ? (
        <Box
          pt="3"
          className={`mt-2 xl:mt-auto text-right border-t border-[var(--gray-a4)] ${
            hasOverflow ? "" : `md:hidden${desktopCapped ? " xl:block" : ""}`
          }`}
        >
          <Link
            to="/vehicles?needs_attention=true"
            className="text-[var(--accent-11)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-9)] rounded-2"
          >
            <Text size="2">Zobacz wszystkie ({totalCount})</Text>
          </Link>
        </Box>
      ) : null}
    </div>
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
