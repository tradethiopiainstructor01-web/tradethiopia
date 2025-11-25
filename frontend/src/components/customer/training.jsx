import React, { useState, useEffect } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Flex,
  Text,
  useToast,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Box,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Button,
  Icon,
  VStack,
  HStack,
  Divider,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  Container,
  Grid,
  GridItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import { 
  FaSync, 
  FaGraduationCap, 
  FaBook, 
  FaVideo, 
  FaFilePdf, 
  FaChartLine, 
  FaTrophy,
  FaCalendarAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMedal,
  FaCheckCircle,
  FaPlayCircle,
  FaHistory
} from 'react-icons/fa';
import Layout from "./Layout";

// Redirect to the modern training page
const Training = () => {
  return <Navigate to="/training" replace />;
};

export default Training;
