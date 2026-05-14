import { Button, Flex } from "@radix-ui/themes";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <Flex justify="between" align="center" mt="4" px={{ initial: "4", md: "0" }}>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Flex gap="4" align="center">
        <Button
          disabled={currentPage === 1}
          onClick={() => {
            onPageChange(currentPage - 1);
          }}
        >
          Previous
        </Button>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => {
            onPageChange(currentPage + 1);
          }}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
