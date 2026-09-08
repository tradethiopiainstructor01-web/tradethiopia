import { Button } from "@chakra-ui/react";

const PageNumberButtons = ({ page, totalPages, onChange, isDisabled = false }) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));

  return Array.from({ length: count }, (_, index) => start + index).map((number) => (
    <Button
      key={number}
      size="xs"
      minW="30px"
      h="30px"
      colorScheme="teal"
      variant={number === page ? "solid" : "outline"}
      aria-label={`Go to page ${number}`}
      aria-current={number === page ? "page" : undefined}
      isDisabled={isDisabled}
      onClick={() => onChange(number)}
    >
      {number}
    </Button>
  ));
};

export default PageNumberButtons;
