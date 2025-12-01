import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Table,
  Tbody,
  Td,
  TableContainer,
  Text,
  Thead,
  Tr,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

const CompactHeaderCell = ({ children, borderColor }) => (
  <Td
    as="th"
    py={3}
    px={3}
    fontSize="sm"
    fontWeight="bold"
    color="white"
    position="sticky"
    top={0}
    bg="transparent"
    zIndex={1}
    boxShadow="sm"
    borderColor={borderColor}
  >
    {children}
  </Td>
);

const EnsraTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  renderColumnMenu,
  ensraColumnOptions,
  ensraColumnsToRender,
  ensraSearch,
  setEnsraSearch,
  ensraTypeFilter,
  setEnsraTypeFilter,
  ensraSortAsc,
  setEnsraSortAsc,
  filteredEnsraFollowups,
  setShowEnsraFormCard,
  isMobile,
}) => {
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="md" color={headerBg}>
              ENSRA Follow-Up
            </Heading>
            <HStack spacing={2}>
              {renderColumnMenu("ensra", ensraColumnOptions)}
              <Tooltip label="Add ENSRA customer">
                <IconButton
                  aria-label="Add ENSRA customer"
                  icon={<AddIcon />}
                  colorScheme="teal"
                  size="sm"
                  onClick={() => setShowEnsraFormCard(true)}
                />
              </Tooltip>
            </HStack>
          </Flex>

          {/* ENSRA search / filter / sort controls */}
          <Flex direction={isMobile ? "column" : "row"} gap={3} align="center">
            <Box flex={1} width="100%">
              <Input
                placeholder="Search by company or job seeker name..."
                value={ensraSearch}
                onChange={(e) => setEnsraSearch(e.target.value)}
                size="sm"
                borderRadius="md"
                borderColor={borderColor}
              />
            </Box>
            <HStack spacing={3}>
              <Input
                as="select"
                size="sm"
                value={ensraTypeFilter}
                onChange={(e) => setEnsraTypeFilter(e.target.value)}
                minW="150px"
              >
                <option value="all">All Types</option>
                <option value="company">Company</option>
                <option value="jobSeeker">Job Seeker</option>
              </Input>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setEnsraSortAsc((prev) => !prev)}
              >
                Sort {ensraSortAsc ? "A-Z" : "Z-A"}
              </Button>
            </HStack>
          </Flex>

          <TableContainer
            overflowX="auto"
            border="1px solid"
            borderColor={tableBorderColor}
            borderRadius="lg"
            bg={tableBg}
            boxShadow="sm"
          >
            <Table
              variant="striped"
              colorScheme="gray"
              size="sm"
              minWidth={isMobile ? "900px" : "auto"}
            >
              <Thead bg={headerBg}>
                <Tr>
                  {ensraColumnsToRender.map((col) => (
                    <CompactHeaderCell key={col.key} borderColor={borderColor}>{col.header}</CompactHeaderCell>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filteredEnsraFollowups.length > 0 ? (
                  filteredEnsraFollowups.map((item) => (
                    <Tr key={item._id || item.id} _hover={{ bg: rowHoverBg }}>
                      {ensraColumnsToRender.map((col) => (
                        <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={ensraColumnsToRender.length || 1} textAlign="center" py={10}>
                      <Text color="gray.500">
                        No ENSRA follow-up records found.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {setShowEnsraFormCard && (
            <Button
              size="sm"
              colorScheme="teal"
              leftIcon={<AddIcon />}
              onClick={() => setShowEnsraFormCard(true)}
              alignSelf="flex-start"
            >
              Register for ENSRA
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default EnsraTabPage;
