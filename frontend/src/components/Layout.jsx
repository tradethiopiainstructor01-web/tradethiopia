import { Box } from "@chakra-ui/react";

const Layout = ({ children }) => {
  return (
    <Box width="100%" pt={{ base: 4, md: 6 }} pb={6}>
      {children}
    </Box>
  );
};

export default Layout;
