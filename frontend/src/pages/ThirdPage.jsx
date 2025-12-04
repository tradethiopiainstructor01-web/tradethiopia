import React from "react";
import {
  Box,
  VStack,
  HStack,
  Image,
  Text,
  Heading,
  useColorModeValue,
  IconButton,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { SunIcon, MoonIcon } from "@chakra-ui/icons";  // Import icons for theme toggle

const MotionBox = motion.create(Box);

// Card Component
const Card = ({ title, description, listItems }) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    overflow="hidden"
    bg={useColorModeValue("white", "gray.700")} // Adjust background based on color mode
    boxShadow="md"
    p={4}
  >
    <Heading size="md" color={useColorModeValue("purple.700", "purple.300")}>
      {title}
    </Heading>
    <Text mt={2} color={useColorModeValue("gray.600", "gray.300")}>
      {description}
    </Text>
    {listItems && (
      <VStack align="start" mt={2} spacing={1}>
        {listItems.map((item, index) => (
          <Text key={index} color={useColorModeValue("gray.600", "gray.300")}>
            - {item}
          </Text>
        ))}
      </VStack>
    )}
  </Box>
);

const ImportExportPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode(); // Get color mode and toggle function

  const pages = {
    page3: {
      title: "TESSBINN",
      description: "Our business school is s a unique academy that is tailored and working to empower local and international business communities. TESBINN has a great track record and sucess story in providing international trade realted short courses. So far, Our institite have delivered trainings to more than 1000 attendees both tin preson and online. Our training customers are our testimonials for the best training value that we are giving, and our trainees are our business networks. Enroll now and get the best of international business skill!",
      videoUrl: "https://www.youtube.com/embed/PAhHi6ePESE?si=LhsjuTOaF93rKxuE" , 
      additionalDescription: <a href="https://tesbinn.com/" target="blank">Our website www.tesbinn.com</a>,
      drawerContent: (
        <>
          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mb={4}>
            Our list of short trainings :
          </Heading>
          <VStack align="start" spacing={2}>
            <Text><strong>1. International Trade and Import-Export Training:</strong>  Comprehensive programs focusing 
on global trade regulations, market entry strategies, and efficient import-export 
practices.</Text>
            <Text><strong>2. Digital Marketing for International Trade:</strong> Training on leveraging digital tools and 
            platforms to enhance international trade efforts.</Text>
            <Text><strong>3. Stock Market:</strong> Insightful courses on stock market principles, trading strategies, and 
investment opportunities.
</Text>
            <Text><strong>4. Artificial Intelligence for Marketing:</strong> Practical applications of AI in optimizing 
            marketing strategies and business operations.</Text>
            <Text><strong>5. Customer Service Excellence:</strong> Techniques and strategies for delivering outstanding 
            customer service in diverse business environments.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>6. Import-Export Marketing & Documentation :</strong> Strategies and tools to effectively 
market products and services in international markets. Documentation with electronic 
single window procedures.</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>7. Telemarketing:</strong> Skills and techniques for successful telemarketing campaigns.</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>8. Netpreneurship:</strong> Training on building and managing online businesses.
            </Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>9. English and Chinese for Business:</strong> Language courses tailored to business contexts, 
            enhancing communication and negotiation skills.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>10. Cyber Security:</strong> Courses on essential digital skills, including design and safeguarding 
            information systems.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>11. Business Process Outsourcing:</strong> Insights into managing outsourcing relationships and 
            processes.</Text><Text fontSize={{ base: "sm", md: "md" }}><strong>12. Data Science:</strong> Analytical skills and tools for data-driven decision-making.</Text>
            <Text><strong>13. Public Speaking and Business Proposal Writing:</strong> Enhancing communication skills and 
crafting effective business proposals.
</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>14. Macroeconomics:</strong> Understanding economic principles and their impact on business 
operations.
</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>15. Salesmanship and Business Development:</strong> Techniques for effective sales and 
strategies for business growth.
</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>16. International Trade Brokerage:</strong> Skills for acting as an intermediary in international 
            trade transactions.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>17. Business Operations Management:</strong> Training on managing and optimizing business 
operations.
</Text>
<Text fontSize={{ base: "sm", md: "md" }}><strong>18. Coffee Industry Training:</strong> Specialized programs in coffee cupping, sustainability, and 
            quality assessment.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>19. Basic Gemstones Technical Training:</strong> Introduction to the technical aspects of 
gemstone trading.
</Text>

          </VStack>

          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mt={6} mb={4}>Training Approach</Heading>
          <VStack align="start" spacing={2} w="full">
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Practical and Applicable:</strong> Our programs are designed to be hands-on and directly applicable to real-world scenarios.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Affordable and Flexible:</strong> We offer cost-effective training solutions with flexible schedules to accommodate various needs.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Qualified Instructors:</strong> Courses are led by industry experts with substantial experience in their respective fields.</Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Certification:</strong> We award certificates recognized by the Ministry of Education and various international accreditation bodies.</Text>
          </VStack>

          <Heading size={{ base: "md", md: "lg" }} color="purple.700" mt={6} mb={4}>Why Choosing Our Trainings?</Heading>
          <VStack align="start" spacing={2} w="full">
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Short Courses</strong></Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- To the point</strong></Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- More Practical</strong></Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Affordable</strong> </Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Directly Usable</strong> </Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Business and innovation centered</strong> </Text>
            <Text fontSize={{ base: "sm", md: "md" }}><strong>- Online or Physical Classes</strong> </Text>
          </VStack>
        </>
      ),
    },
  };

  const currentContent = pages.page3;

  // Card Data
  const cardData = [
    { title: "Mission", description: "To empower the business society by equipping individuals and organizations with the knowledge and skills necessary to excel in the global and local business environments." },
    { title: "Vision", description: "To be one of the leading innovative business schools in Africa by 2030, renowned for our practical approach and commitment to excellence in business education." },
    { title: "Values", description: "Affordable, Concise and Practical, Real-World Alignment" },
  ];

  return (
    <Box minH="100vh" display="flex" bg={useColorModeValue("gray.50", "gray.800")} p={10}>
      <VStack align="start" spacing={10} flex="1">
        {/* Theme Toggle Button */}
        <IconButton
          aria-label="Toggle theme"
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          position="fixed"
          top={4}
          right={4}
          zIndex="10"
        />

        {/* Header with Logo */}
        <HStack
          justify="space-between"
          width="100%"
          mb={6}
          align="center"
          spacing={4}
          wrap="wrap"
        >
          {/* Logo Section */}
          <HStack spacing={3}>
            <Image 
              src="/tesbinn.jpg" // Replace with your logo URL
              alt="TESBINN Logo"
              boxSize="50px"
              objectFit="contain"
            />
            <Heading size="2xl" color={useColorModeValue("purple.700", "purple.300")}>
              TESSBINN
            </Heading>
          </HStack>
        </HStack>

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
          onClick={onOpen}
          variant="solid"
        >
          List Of Trainings
        </Button>

        {/* Drawer for additional content */}
        <Drawer
          isOpen={isOpen}
          onClose={onClose}
          size="md"
          placement="right"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>More Information</DrawerHeader>
            <DrawerBody>{currentContent.drawerContent}</DrawerBody>
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
            onClick={() => navigate("/fifthpage")}
            _hover={{ backgroundColor: "purple.500", color: "white" }}
          >
            Next
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ImportExportPage;