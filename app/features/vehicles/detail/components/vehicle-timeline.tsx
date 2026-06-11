import { Badge, Box, Button, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { DataView } from "~/components/feedback/data-view";
import type { TimelineEventView, VehicleTimelineState } from "../types";

export function VehicleTimeline({ state }: { state: VehicleTimelineState }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Historia zdarzeń">
        <Heading as="h2" size="4" mb="4">
          Historia zdarzeń
        </Heading>
        <DataView state={state} loading={<TimelineSkeleton />}>
          {(data) => (
            <Flex direction="column" gap="4">
              <Flex asChild direction="column" gap="4">
                <ol>
                  {data.events.map((event) => (
                    <TimelineRow key={event.id} event={event} />
                  ))}
                </ol>
              </Flex>
              <Flex direction="column" gap="2" align="start">
                <Text size="1" color="gray">
                  Pokazano {data.shownCount} z {data.total} zdarzeń
                </Text>
                {data.hasMore && (
                  <Button
                    size="2"
                    variant="soft"
                    onClick={data.onLoadMore}
                    loading={data.isLoadingMore}
                  >
                    Pokaż więcej
                  </Button>
                )}
                {data.loadMoreError && (
                  <Flex gap="2" align="center">
                    <Text size="1" color="red">
                      Nie udało się wczytać kolejnych zdarzeń
                    </Text>
                    <Button size="1" variant="ghost" onClick={data.onRetryLoadMore}>
                      Spróbuj ponownie
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Flex>
          )}
        </DataView>
      </section>
    </Card>
  );
}

function TimelineRow({ event }: { event: TimelineEventView }) {
  return (
    <Flex asChild gap="3" align="start">
      <li>
        <Box
          mt="1"
          width="8px"
          height="8px"
          flexShrink="0"
          style={{ background: event.dotColor, borderRadius: "9999px" }}
        />
        <Flex direction="column" gap="1" flexGrow="1" minWidth="0">
          <Flex justify="between" gap="3" align="baseline" wrap="wrap">
            <Flex gap="2" align="center">
              <Text weight="medium">{event.title}</Text>
              {event.statusBadge && (
                <Badge color={event.statusBadge.color} variant="soft" size="1">
                  {event.statusBadge.label}
                </Badge>
              )}
            </Flex>
            {event.costLabel && <Text weight="medium">{event.costLabel}</Text>}
          </Flex>
          <Text size="1" color="gray">
            {event.detail} · {event.mileageLabel}
          </Text>
          <Text size="1" color="gray">
            {event.dateLabel}
          </Text>
        </Flex>
      </li>
    </Flex>
  );
}

function TimelineSkeleton() {
  return (
    <Flex direction="column" gap="4">
      {Array.from({ length: 5 }, (_, i) => (
        <Flex key={i} gap="3" align="start">
          <Skeleton width="8px" height="8px" style={{ borderRadius: "9999px", marginTop: "4px" }} />
          <Flex direction="column" gap="1" flexGrow="1">
            <Skeleton width="40%" height="16px" />
            <Skeleton width="60%" height="12px" />
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
}
