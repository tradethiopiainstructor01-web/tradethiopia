import React, { useEffect, useRef, useState, memo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { RepeatIcon, SearchIcon } from "@chakra-ui/icons";

const statusColor = (status = "") => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    case "scheduled":
      return "purple";
    case "prospect":
      return "blue";
    case "imported":
      return "cyan";
    default:
      return "yellow";
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const valueOrDash = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim()) || "—";

const SalesFollowupsTabPage = ({
  salesCustomers = [],
  pagination = {},
  loading,
  error,
  onRefresh,
  cardBg,
  borderColor,
}) => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onRefreshRef.current?.({
        page,
        limit: 15,
        search,
        followupStatus: "Completed",
        packageScope: scope === "all" ? "" : scope,
        dateFrom,
        dateTo,
      });
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [page, search, scope, dateFrom, dateTo]);

  const total = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const currentPage = Math.min(Math.max(1, Number(pagination.page) || page), totalPages);
  const firstRecord = total ? (currentPage - 1) * 15 + 1 : 0;
  const lastRecord = total ? Math.min(firstRecord + salesCustomers.length - 1, total) : 0;

  const refreshCurrentPage = () => onRefreshRef.current?.({
    page,
    limit: 15,
    search,
    followupStatus: "Completed",
    packageScope: scope === "all" ? "" : scope,
    dateFrom,
    dateTo,
  });

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
      <Flex gap={3} direction={{ base: "column", lg: "row" }} justify="space-between" mb={4}>
        <Box>
          <Text fontSize="lg" fontWeight="700">Sales Customer Follow-ups</Text>
          <Text fontSize="sm" color="gray.500">
            Completed sales customers and their latest follow-up details.
          </Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          size="sm"
          variant="outline"
          onClick={refreshCurrentPage}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      <Flex gap={2} direction={{ base: "column", md: "row" }} mb={4}>
        <Box position="relative" flex="1">
          <SearchIcon position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search customer, phone, email, agent or product"
            size="sm"
            pl={9}
            borderRadius="lg"
          />
        </Box>
        <Select value={scope} onChange={(event) => {
          setScope(event.target.value);
          setPage(1);
        }} size="sm" maxW={{ md: "170px" }}>
          <option value="all">All package scopes</option>
          <option value="Local">Local</option>
          <option value="International">International</option>
        </Select>
        <Input
          type="date"
          aria-label="From date"
          title="From date"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          size="sm"
          maxW={{ md: "165px" }}
        />
        <Input
          type="date"
          aria-label="To date"
          title="To date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          size="sm"
          maxW={{ md: "165px" }}
        />
        {(dateFrom || dateTo) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Clear dates
          </Button>
        )}
      </Flex>

      {loading ? (
        <Flex justify="center" py={12}><Spinner color="teal.500" /></Flex>
      ) : error ? (
        <Box py={8} textAlign="center">
          <Text color="red.500" mb={3}>{error}</Text>
          <Button size="sm" onClick={refreshCurrentPage}>Try again</Button>
        </Box>
      ) : (
        <>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.500">
              Showing {firstRecord}-{lastRecord} of {total} sales follow-ups
            </Text>
          </HStack>
          <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg">
            <Table size="sm" minW="2400px" variant="striped" colorScheme="gray">
              <Thead bg="teal.600">
                <Tr>
                  {[
                    "Training Start Date",
                    "Training End Date",
                    "Customer Services",
                    "Assigned Instructor",
                    "Customer Name",
                    "Email",
                    "Phone Number",
                    "Field of Work",
                    "Course",
                    "Batch/Group",
                    "Schedule & Shift",
                    "Material Delivery Status",
                    "Progress",
                    "ID Info",
                    "Actions",
                  ].map((heading) => (
                    <Th key={heading} color="white" whiteSpace="nowrap">{heading}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {salesCustomers.map((customer) => (
                  <Tr key={customer._id} _hover={{ bg: "gray.50" }}>
                    <Td whiteSpace="nowrap">{formatDate(customer.startDate || customer.trainingStartDate)}</Td>
                    <Td whiteSpace="nowrap">{formatDate(customer.endDate || customer.trainingEndDate)}</Td>
                    <Td>{valueOrDash(customer.agentName, customer.registeredBy, customer.csMember)}</Td>
                    <Td>{valueOrDash(customer.assignedInstructor, customer.instructorName)}</Td>
                    <Td fontWeight="600">{valueOrDash(customer.customerName)}</Td>
                    <Td>{valueOrDash(customer.email)}</Td>
                    <Td>{valueOrDash(customer.phone, customer.phoneNumber)}</Td>
                    <Td>{valueOrDash(customer.fieldOfWork, customer.productInterest)}</Td>
                    <Td>{valueOrDash(customer.trainingType, customer.courseName, customer.contactTitle)}</Td>
                    <Td>{valueOrDash(customer.batch, customer.group, customer.batchGroup)}</Td>
                    <Td>{valueOrDash(customer.scheduleShift, customer.preferredTimeSlot, customer.schedulePreference)}</Td>
                    <Td>{valueOrDash(customer.materialStatus, customer.materialDeliveryStatus, 'Not Delivered')}</Td>
                    <Td>
                      <Badge colorScheme={statusColor(customer.progress || customer.followupStatus)}>
                        {valueOrDash(customer.progress, customer.followupStatus)}
                      </Badge>
                    </Td>
                    <Td>{valueOrDash(customer.idInfo, customer.studentId)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          as="a"
                          href={customer.phone ? `tel:${customer.phone}` : undefined}
                          size="xs"
                          variant="outline"
                          colorScheme="teal"
                          isDisabled={!customer.phone}
                        >
                          Call
                        </Button>
                        <Button
                          as="a"
                          href={customer.email ? `mailto:${customer.email}` : undefined}
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          isDisabled={!customer.email}
                        >
                          Email
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {!salesCustomers.length && (
                  <Tr><Td colSpan={17} textAlign="center" py={10} color="gray.500">No sales follow-ups match these filters.</Td></Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="space-between" align="center" mt={4} gap={3} flexWrap="wrap">
            <Text fontSize="sm" color="gray.500">
              Page {currentPage} of {totalPages} · 15 rows per page
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                isDisabled={loading || currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                isDisabled={loading || currentPage >= totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default memo(SalesFollowupsTabPage);
