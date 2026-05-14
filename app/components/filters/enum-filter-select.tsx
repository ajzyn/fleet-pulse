import { Flex, Select, Text } from "@radix-ui/themes";

const ALL = "all";

interface EnumFilterSelectProps<T extends string> {
  id: string;
  label: string;
  allLabel: string;
  options: T[];
  getOptionLabel: (value: T) => string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

export function EnumFilterSelect<T extends string>({
  id,
  label,
  allLabel,
  options,
  getOptionLabel,
  value,
  onChange,
}: EnumFilterSelectProps<T>) {
  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2" htmlFor={id} color="gray">
        {label}
      </Text>
      <Select.Root
        value={value ?? ALL}
        onValueChange={(v) => {
          onChange(v === ALL ? undefined : (v as T));
        }}
      >
        <Select.Trigger id={id}>{value ? getOptionLabel(value) : allLabel}</Select.Trigger>
        <Select.Content className="z-[60]">
          <Select.Item value={ALL}>{allLabel}</Select.Item>
          {options.map((o) => (
            <Select.Item key={o} value={o}>
              {getOptionLabel(o)}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
