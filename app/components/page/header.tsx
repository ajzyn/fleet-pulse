import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}
export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <Flex
      direction={{ initial: "column", sm: "row" }}
      justify="between"
      align="start"
      mb="6"
      gap="4"
      wrap="wrap"
    >
      <Box>
        <Heading size="6" mb={subtitle ? "1" : "0"}>
          {title}
        </Heading>
        {subtitle && (
          <Text size="1" color="gray" as="p">
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && <Box>{actions}</Box>}
    </Flex>
  );
}
