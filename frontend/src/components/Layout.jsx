import { Box } from "@chakra-ui/react";

const Layout = ({ children }) => {
  return (
    <Box
      width="100%"
      px={{ base: 4, md: 6 }}
      pt={{ base: 6, md: 8 }}
      pb={8}
      minH="calc(100vh - 80px)"
    >
      {children}
    </Box>
  );
};

export default Layout;
