import React from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  Heading,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  HStack,
  SimpleGrid,
  tokenToCSSVar,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);

// Card Component
const Card = ({ title, description, listItems }) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    overflow="hidden"
    bg="white"
    boxShadow="md"
    p={4}
  >
    <Heading size="md" color="purple.700">{title}</Heading>
    <Text mt={2} color="gray.600">{description}</Text>
    {listItems && (
      <VStack align="start" mt={2} spacing={1}>
        {listItems.map((item, index) => (
          <Text key={index} color="gray.600">- {item}</Text>
        ))}
      </VStack>
    )}
  </Box>
);

const TTV = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const navigate = useNavigate();

  const pages = {
    page3: {
      title: "TradeEthiopia Business TV & Radio",
      description: "TradeEthiopia Business TV & Radio is an Ethiopian media platform focused on connecting businesses and fostering economic growth through dedicated media coverage. As an affiliate of TradeEthiopia, we provide a reliable channel for promoting trade, investment, and economic development across Africa and beyond. Our programming is designed to inform, educate, and connect business communities by offering insights into trade, market trends, business innovations, and policy developments that impact local, regional, and global markets.", 
      videoUrl: "https://www.youtube.com/embed/kPcL17X1VaQ?si=VhPEdVDllS0c1Zqc", // Replace with actual video ID
      additionalDescription: "media@tradeethiopiabusinesstv.com",
      drawerContent: (
        <>
          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mb={4}>Programs and Offerings</Heading>
          <VStack align="start" spacing={2} w="full">
            <Text fontSize={{ base: "sm", md: "md" }}><strong>1. Market Insights and Analysis:</strong> Coverage of sector-specific trends, such as agriculture, manufacturing, mining, tourism, and trade policy.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>2. Business News and Updates:</strong> Providing up-to-date news on business developments within Ethiopia, Africa, and internationally.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>3. Interviews with Industry Experts:</strong> Featuring thought leaders and innovators who share their insights and experiences.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>4. Trade Opportunities:</strong> Highlighting opportunities for local exporters and international investors.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>5. Educational Segments:</strong> Offering information on best practices, trade regulations, and market entry strategies to support business growth.</Text>
          </VStack>
      
          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mt={6} mb={4}>Services</Heading>
          <VStack align="start" spacing={2} w="full">
            <Text fontSize={{ base: "sm", md: "md" }}><strong>1. Media Advertising Solutions:</strong> Providing tailored advertising options across TV and radio channels for businesses seeking visibility and brand promotion.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>2. Content Production:</strong> Offering production services for commercials, educational programs, and promotional content with a focus on professional quality and engaging storytelling.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>3. Corporate Sponsorship Packages:</strong> Creating sponsorship opportunities for corporations looking to support trade-related content while enhancing their brand presence.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>4. Event Coverage and Broadcasting:</strong> Comprehensive coverage of trade expos, forums, conferences, and business events, ensuring audiences access to key insights and discussions.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>5. Consultancy on Trade and Business Media Strategies:</strong> Providing consultancy for companies aiming to enhance their media presence and align with trade-related media strategies.</Text>
          </VStack>
      
          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mt={6} mb={4}>Key Partnerships</Heading>
          <VStack align="start" spacing={2} w="full">
            <Text fontSize={{ base: "sm", md: "md" }}>- Collaborations with organizations such as the African Union, COMESA, and the Addis Ababa
Chamber of Commerce.
</Text>
            <Text fontSize={{ base: "sm", md: "md" }}>- Working alongside international trade chambers, including the U.S. Africa Chamber and China
Africa Business Network, to broaden audience reach and partnership opportunities.
</Text>
           </VStack>
        </>
      ),
    },
  };

  const currentContent = pages.page3;

 // Card Data

 const cardData = [
  {
    title: "Mission",
    description: "To inform, connect, and empower businesses through high-quality, reliable media content supporting Ethiopia's economic integration into the global marketplace."
  },
  {
    title: "Vision",
    description: "To become a trusted media platform for business insights and trade information, amplifying voices in trade and economic development."
  },
  {
    title: "Core Values",
    description: "Integrity, Empowerment,  Innovation, Inclusivity, Community-Oriented"
  },
  // {
  //   title: "Core Values:",
  //   description: (
  //     <VStack align="start" spacing={2} w="full">
  //       <Text fontSize={{ base: "sm", md: "md" }}><strong>1. Integrity:</strong> Committed to the highest standards of journalistic ethics and accuracy.</Text>
  //       <Text fontSize={{ base: "sm", md: "md" }}><strong>2. Empowerment:</strong> Providing Ethiopian businesses with the information and visibility to reach new markets.</Text>
  //       <Text fontSize={{ base: "sm", md: "md" }}><strong>3. Innovation:</strong> Utilizing modern technology and multimedia to enhance engagement with our audience.</Text>
  //       <Text fontSize={{ base: "sm", md: "md" }}><strong>4. Inclusivity:</strong> Serving a diverse business community, including SMEs, large corporations, and cooperatives, ensuring fair representation.</Text>
  //       <Text fontSize={{ base: "sm", md: "md" }}><strong>5. Community-Oriented:</strong> Building partnerships that promote community and economic growth.</Text>
  //     </VStack>
  //   )
  // }
];


  return (
    <Box minH="100vh" display="flex" bg={useColorModeValue("gray.50", "gray.800")} p={10}>
      <VStack align="start" spacing={10} flex="1">
        {/* Page Title */}
        <Heading size="2xl" color={useColorModeValue("purple.700", "purple.300")} textAlign="center">
        TradeEthiopia Business TV & Radio
        </Heading>


{/* Animated Line under Heading */}
        <MotionBox
          height="2px"
          bg="purple.500"
          width="50%"
          mx="auto"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          mt={1}
        />
<iframe
          width="100%"
          height="315"
          src={currentContent.videoUrl}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>

        {/* Additional Description Box */}
        <Box
          bg={useColorModeValue("gray.100", "gray.700")}
          p={6}
          borderRadius="md"
          shadow="md"
          w="100%"
        >
          <Text fontSize="lg" color={useColorModeValue("gray.700", "gray.200")}>
            {currentContent.additionalDescription}
          </Text>
        </Box>
        
        <Text fontSize="lg" color={useColorModeValue("gray.600", "gray.300")}>
          {currentContent.description}
        </Text>

        

        

        {/* Cards Section */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%">
          {cardData.map((card, index) => (
            <Card key={index} title={card.title} description={card.description} listItems={card.listItems} />
          ))}
        </SimpleGrid>
        
        
        <Button
          colorScheme="teal"
          onClick={() => setIsDrawerOpen(true)}
          variant="solid"
        >
          Services
        </Button>

        {/* Drawer for additional content */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size="md"
          placement="right"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>More Information</DrawerHeader>
            <DrawerBody>
              <VStack align="start" spacing={4} p={4}>
                {currentContent.drawerContent}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Navigation Buttons */}
        <HStack justify="space-between" mt={6}>
          <Button
            colorScheme="purple"
            variant="outline"
            onClick={() => navigate(-1)}
            _hover={{ backgroundColor: "purple.500", color: "white" }}
          >
            Back
          </Button>
          <Button
            colorScheme="purple"
            onClick={() => navigate("/fourthpage")}
            _hover={{ backgroundColor: "purple.500", color: "white" }}
          >
            Next
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TTV;
