import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

const surfaceStyles = (pick) => ({
  bg: pick("rgba(255,255,255,0.94)", "rgba(15,23,42,0.86)"),
  borderWidth: "1px",
  borderColor: pick("rgba(226,232,240,0.92)", "rgba(148,163,184,0.16)"),
  boxShadow: pick("0 16px 44px rgba(15,23,42,0.07)", "0 18px 46px rgba(0,0,0,0.32)"),
  backdropFilter: "blur(20px) saturate(1.25)",
});

export function SurfaceCard({ children, ...props }) {
  const styles = surfaceStyles(useColorModeValue);
  const hoverShadow = useColorModeValue("0 22px 54px rgba(15,23,42,0.10)", "0 24px 60px rgba(0,0,0,0.38)");

  return (
    <Card
      borderRadius="20px"
      overflow="hidden"
      transition="box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease"
      _hover={{ transform: "translateY(-1px)", boxShadow: hoverShadow, borderColor: "blue.100" }}
      {...styles}
      {...props}
    >
      {children}
    </Card>
  );
}

export function SectionIntro({ eyebrow, title, description, actions }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("#0F172A", "white");

  return (
    <Flex justify="space-between" align={{ base: "stretch", lg: "flex-end" }} gap={4} direction={{ base: "column", lg: "row" }}>
      <VStack align="start" spacing={1} maxW="3xl">
        {eyebrow ? (
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.14em" color={muted} fontWeight="700">
            {eyebrow}
          </Text>
        ) : null}
        <Heading size="lg" letterSpacing="0" color={titleColor}>
          {title}
        </Heading>
        {description ? (
          <Text color={muted} maxW="2xl">
            {description}
          </Text>
        ) : null}
      </VStack>
      {actions ? <HStack spacing={3} alignSelf={{ base: "stretch", lg: "center" }} flexWrap="wrap">{actions}</HStack> : null}
    </Flex>
  );
}

export function MetricCard({ label, value, subtext, icon, accent = "blue", trend, progress = 0 }) {
  const iconBg = useColorModeValue(`${accent}.50`, `${accent}.500`);
  const iconColor = useColorModeValue(`${accent}.600`, "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const trackBg = useColorModeValue("rgba(226,232,240,0.9)", "whiteAlpha.100");
  const panelBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.74))"
  );

  return (
    <SurfaceCard bgImage={panelBg}>
      <CardBody p={5}>
        <Flex justify="space-between" align="flex-start" gap={4}>
          <Stat>
            <StatLabel fontSize="sm" color={muted} mb={2}>
              {label}
            </StatLabel>
            <StatNumber fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="0">
              {value}
            </StatNumber>
            {subtext ? (
              <StatHelpText mb={0} mt={2} color={muted}>
                {subtext}
              </StatHelpText>
            ) : null}
          </Stat>
          {icon ? (
            <Flex
              w="44px"
              h="44px"
              align="center"
              justify="center"
              borderRadius="14px"
              bg={iconBg}
              color={iconColor}
              flexShrink={0}
              boxShadow="inset 0 1px 0 rgba(255,255,255,0.42)"
            >
              <Icon as={icon} boxSize={5} />
            </Flex>
          ) : null}
        </Flex>
        <HStack justify="space-between" mt={4} mb={2}>
          <Badge colorScheme={trend?.positive ? "green" : "orange"} variant="subtle" borderRadius="full" px={2.5} py={0.5}>
            {trend?.label || "Stable"}
          </Badge>
          <Text fontSize="xs" color={muted}>
            {progress}%
          </Text>
        </HStack>
        <Progress value={progress} colorScheme={accent} size="sm" borderRadius="full" bg={trackBg} />
      </CardBody>
    </SurfaceCard>
  );
}

export function EmptyStateBlock({ title, description, action, badge = "Empty state" }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const bg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");

  return (
    <Box borderRadius="20px" borderWidth="1px" borderStyle="dashed" borderColor={border} bg={bg} p={8}>
      <VStack spacing={3} align="start">
        <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1}>
          {badge}
        </Badge>
        <Heading size="sm">{title}</Heading>
        <Text color={muted} maxW="lg">
          {description}
        </Text>
        {action || null}
      </VStack>
    </Box>
  );
}
