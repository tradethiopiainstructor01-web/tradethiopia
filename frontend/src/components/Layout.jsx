import Sidebar from "./Sidebar"; // Import Sidebar component
import { Box, Flex } from "@chakra-ui/react";

const Layout = ({ children }) => {
  return (
    <Flex>
      <Sidebar />
      <Box
        ml={{ base: "70px", md: "250px" }} // This ensures content is pushed right if the sidebar is visible
        p={{ base: 2, md: 5 }}
        w="full"
        minHeight="100vh"
        pt="80px" // Account for navbar height
      >
        {children}
      </Box>
    </Flex>
  );
};

export default Layout;