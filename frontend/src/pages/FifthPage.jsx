
import React from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Divider,
  Grid,
  GridItem,
  Card,
  CardBody,
  IconButton,
  useColorMode,
  useColorModeValue,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Heading,
} from "@chakra-ui/react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const FifthPage = () => {
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const sidebarBgColor = useColorModeValue("teal.600", "teal.800");
  const sidebarTextColor = useColorModeValue("white", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const cardTextColor = useColorModeValue("gray.700", "whiteAlpha.800");
  const tabHighlightColor = useColorModeValue("purple.400", "purple.600");

  const expoDetails = [
    {
      title: "Ethio – International Expo",
      description: "Ethio – International Expo will provide sponsors with a marketing opportunity to create a high-profile association. It is a way to develop relationships from which both parties can benefit and to ensure that all possible opportunities are pursued. The Ethio – International Expo, B2B and Business conference is a unique collaboration environment that is bonding African market with the rest of the world specifically the diaspora.",
    },
      {
        title: "Categories",
        description: (
          <ul>
            <li>Agri Products</li>
            <li>Renewable Energy and Electric Car</li>
            <li>Tourism</li>
            <li>Garment and Textile</li>
            <li>Real Estate</li>
            <li>Mining</li>
          </ul>
        ),
      },
    {
      title: "Networking Opportunities",
      description: "Connect with industry leaders and potential partners.",
    },
    {
      title: "Cultural Exhibits",
      description: "Experience Ethiopia’s rich culture through exhibitions.",
    },
  ];

  // Objectives of Ethio - International Expo
  const objectives = [
    "To interlink buyers with suppliers",
    "To facilitate export/import and international trade of agricultural products",
    "To boost the real estate market",
    "To interlink tour operators",
    "To boost the renewable energy and electric car markets",
    "To generate foreign currency",
    "To bring together continental and global players to showcase and exhibit their goods and services, and to explore business and investment opportunities in Ethiopia and beyond.",
    "To serve as a marketplace where buyers and sellers of goods and services meet and explore business opportunities.",
    "To provide a platform for B2B exchanges and development of business opportunities.",
    "To share trade, investment, and market information of Ethiopia with stakeholders including the diaspora, investors, SMEs, the informal sector, and to identify solutions to address the challenges affecting Ethiopia U.S.A trade.",
    "For banks and other financial institutions, to share information about their diaspora mortgage, account privileges, trade finance and international trade facilitation interventions that will support diaspora housing and investment programs.",
    "To discuss potential business and investment opportunities of Ethiopia with international exhibitors/visitors.",
    "To deploy multi country and multi company online pavilions that will serve as one stop shop for intra Ethiopia trade and investment opportunities.",
    "To transform the traditional way of trade fair into virtual.",
    "To add up on Ethiopia's digital economy.",
  ];

  // Value Added Benefits for Exhibitors
  const valueAddedBenefits = [
    "Access to the exhibitor portal",
    "Exhibitor Listing Online",
    "Social Media Exposure",
    "Trade & Investment Conference",
    "Online Diary",
    "EIE Virtual - 365 digital networking platform",
    "Business to Business and Business to Government Meeting",
  ];


// EIE Virtual Visitor Features
  const visitorFeatures = [
    "Visit exhibitors at their virtual booths and engage via live text, audio, group, and one-on-one chat.",
    "Participants will get to enjoy live sessions with exhibitors showcasing their products and services followed by Q&A and watch all missed speaker presentations on demand.",
    "Visitors in different time zones can leave a message for exhibitors to contact them.",
    "Able to collect brochures and other exhibitor collateral and share with colleagues via email.",
    "Networking Lounge - Reach out to relevant business contacts, initiate private conversations and join special interest groups.",
    "Access import and export information from the Resource Center.",
    "Engage with banks, who will share their offers on various aspects of trade, export/import finance, housing, and cars.",
    "Receive relevant news, event, and opportunity updates.",
    "Get dedicated assistance from the Help Desk.",
  ];

  return (
    <Box minH="100vh" bg={bgColor} color={textColor} position="relative">
      {/* Theme Toggle Icon */}
      <Box position="fixed" top={4} right={4} zIndex="10">
        <IconButton
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          bg="transparent"
          _hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
          p={3}
          aria-label="Toggle Theme"
          color={textColor}
        />
      </Box>

      {/* Sidebar */}
      <Box
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        w="120px"
        bg={sidebarBgColor}
        display={{ base: "none", md: "flex" }} // Hide on small screens
        justifyContent="center"
        alignItems="center"
      >
        <Text
          fontSize="5xl"
          fontWeight="bold"
          color={sidebarTextColor}
          transform="rotate(-90deg)"
          textAlign="center"
          whiteSpace="nowrap"
        >
          Ethio-International Expo
        </Text>
      </Box>

      {/* Main Content */}
      <Container
        maxW="7xl"
        py={10}
        ml={{ base: 0, md: "140px" }} // Adjust for the sidebar width only on larger screens
      >
        {/* Video and Image Section */}
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={6}
          alignItems="center"
        >
          <Box
            flex="1"
            w="full"
            bg={cardBgColor}
            borderRadius="md"
            p={4}
            boxShadow="md"
            mt={4}
          >
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb={4}>
              Learn More About Ethio-International Expo
            </Text>
            <Box
              position="relative"
              pb="56.25%" // This maintains a 16:9 aspect ratio
              height="0"
              overflow="hidden"
            >
              <iframe
                src="https://www.youtube.com/embed/ONomPb1UaHY?si=1VTUrNFQH3yPN2UW"
                title="Tutorial Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "8px",
                  outline: "none",
                }}
              ></iframe>
            </Box>
          </Box>

          <Image
            src="/Ethio.jpg" // Replace with the actual image path
            alt="Ethio-International Expo"
            borderRadius="lg"
            boxShadow="lg"
            objectFit="cover"
            w="100%"
            h={{ base: "200px", md: "auto" }}
          />
        </Grid>

{/* Highlights Section */}
        <Box w="full" mt={10}>
          <Tabs variant="soft-rounded" colorScheme="purple" defaultIndex={1}>

             <HStack spacing={4} justify="space-between" w="full">
               <Box
                 flex="1"
                 p={4}
                 bg={cardBgColor}
                 borderRadius="md"
                 textAlign="center"
                 boxShadow="lg"
                 _hover={{
                   transform: "scale(1.05)",
                   transition: "all 0.3s",
                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                 }}
               >
                 <Text fontSize="lg" fontWeight="bold">
                 Our Mission
                 </Text>
                 <Divider mb={2}/>
                 <Text>
                 Connecting businesse effectively to maximize opportunities.
                 </Text>
               </Box>
               <Box
                 flex="1"
                 p={4}
                 bg={cardBgColor}
                 borderRadius="md"
                 textAlign="center"
                 boxShadow="lg"
                 _hover={{
                   transform: "scale(1.05)",
                   transition: "all 0.3s",
                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                 }}
               >
                 <Text fontSize="lg" fontWeight="bold">
                  Our Vision
                 </Text>
                 <Divider mb={2}/>
                 <Text>
                   To become Africa's leading B2B company by 2030.
                 </Text>
               </Box>
   
             </HStack>

             <Divider my={6} />
             <HStack spacing={4} justify="space-between" w="full">
             <Box
                 flex="1"
                 p={4}
                 bg={cardBgColor}
                 borderRadius="md"
                 textAlign="center"
                 boxShadow="lg"
                 _hover={{
                   transform: "scale(1.05)",
                   transition: "all 0.3s",
                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                 }}
               >
                 <Text fontSize="lg" fontWeight="bold">
                  Core Values
                 </Text>
                 <Divider mb={2}/>
                 <Text>
                   Reliability in delivering high-quality B2B services.
                   Supporting clients in building sustainable business operations.
                 </Text>
               </Box>
             </HStack>
             <Divider my={6} />
            <TabList>
              <Tab _selected={{ color: "white", bg: tabHighlightColor }}>
                Overview
              </Tab>
              <Tab _selected={{ color: "white", bg: tabHighlightColor }}>
                Highlights
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb={4}>
                  Welcome to the Ethio-International Expo!
                  <Divider />
                </Text>
                <Text fontSize={{ base: "sm", md: "md" }}>
                  Ethio-International Expo-EIE - is the brand name of our expo that is happening three times a year in Ethiopia and other selected market destinations. The hybrid expo - in person and virtual - aims to interlink businesses throughout the world through an affordable and effective trade fair model supported by artificial intelligence marketing tools.
                  Perfect to discover:
                </Text>
                <ul style={{ marginLeft: "20px", marginTop: "10px" }}>
                  <li>- Innovative solutions in business and technology</li>
                  <li>- A platform for networking with global leaders</li>
                  <li>- An immersive experience into Ethiopia’s rich culture</li>
                </ul>

                {/* New Sections under Overview */}
                <Box mt={10}>
                  <Heading size="lg" fontSize={{ base: "md", md: "lg" }}>
                    The Objectives of Ethio - International Expo
                  </Heading>
                  <VStack align="start" spacing={2} mt={4}>
                    {objectives.map((objective, index) => (
                      <Text key={index} fontSize={{ base: "sm", md: "md" }}>
                        ▪️ {objective}
                      </Text>
                    ))}
                  </VStack>
                </Box>

                <Box mt={10}>
                  <Heading size="lg" fontSize={{ base: "md", md: "lg" }}>
                    Value Added Benefits for Exhibitors
                  </Heading>
                  <VStack align="start" spacing={2} mt={4}>
                    {valueAddedBenefits.map((benefit, index) => (
                      <Text key={index} fontSize={{ base: "sm", md: "md" }}>
                        ▪️ {benefit}
                      </Text>
                    ))}
                  </VStack>
                </Box>

<Box mt={10}>
                  <Heading size="lg" fontSize={{ base: "md", md: "lg" }}>
                    EIE Virtual Visitor Features
                  </Heading>
                  <VStack align="start" spacing={2} mt={4}>
                    {visitorFeatures.map((feature, index) => (
                      <Text key={index} fontSize={{ base: "sm", md: "md" }}>
                        ▪️ {feature}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </TabPanel>
              <TabPanel>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  {expoDetails.map((expo, index) => (
                    <GridItem key={index}>
                      <Card
                        bg={cardBgColor}
                        boxShadow="xl"
                        p={4}
                        color={cardTextColor}
                      >
                        <CardBody>
                          <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="bold" mb={2}>
                            {expo.title}
                          </Text>
                          <Text fontSize={{ base: "sm", md: "md" }}>{expo.description}</Text>
                        </CardBody>
                      </Card>
                    </GridItem>
                  ))}
                </Grid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        
     {/* Cards with Content */}


      </Container>

{/* Footer */}
<Box py={8} px={8} bg={useColorModeValue("gray.100", "gray.800")} color={useColorModeValue("gray.800", "gray.200")}>
  {/* Footer Content Section */}
  <Container maxW="container.lg">
    <VStack spacing={6} align="center" textAlign="center">
      {/* Contact Info Section */}
      <Box w="full">
        <VStack spacing={4} mb={6}>
          <Text fontSize={{ base: "sm", md: "md" }}>
            <strong>Email:</strong> register@ethiointernationalexpo.com
          </Text>
          <Text fontSize={{ base: "sm", md: "md" }}>
            <strong>Phone:</strong> +251 929243367 / +251 904944444
          </Text>
        </VStack>
      </Box>

      {/* Button Section */}
      <HStack spacing={4} justify="center" w="full">
        <Button
          colorScheme="purple"
          variant="outline"
          onClick={() => navigate(-1)}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
          leftIcon={<FaArrowLeft />}
        >
          Back
        </Button>
        <Button
          colorScheme="purple"
          onClick={() => navigate("/ttv")}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
        >
          NEXT
        </Button>
      </HStack>
    </VStack>
  </Container>
</Box>

    </Box>
  );
};

export default FifthPage;