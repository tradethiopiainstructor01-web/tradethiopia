import { useState } from "react";
import axios from "axios";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  Textarea,
  Select
} from "@chakra-ui/react";

const EditCustomerInfo = ({ customer, onSuccess }) => {
  const [formData, setFormData] = useState({
    clientName: customer.clientName,
    companyName: customer.companyName,
    phoneNumber: customer.phoneNumber,
    email: customer.email,
    packageType: customer.packageType,
    deadline: customer.deadline ? customer.deadline.split('T')[0] : "", // Format date for input
    serviceProvided: customer.serviceProvided,
    serviceNotProvided: customer.serviceNotProvided
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/followups/${customer._id}/edit`, // Note the /edit suffix
        formData
      );
      
      toast({
        title: "Customer updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error updating customer",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Client Name</FormLabel>
          <Input
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Company Name</FormLabel>
          <Input
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Phone Number</FormLabel>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Package Type</FormLabel>
          <Select
            name="packageType"
            value={formData.packageType || ""}
            onChange={handleChange}
            placeholder="Select package type"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Deadline</FormLabel>
          <Input
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Service Provided</FormLabel>
          <Textarea
            name="serviceProvided"
            value={formData.serviceProvided}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Service Not Provided</FormLabel>
          <Textarea
            name="serviceNotProvided"
            value={formData.serviceNotProvided}
            onChange={handleChange}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="teal"
          isLoading={isLoading}
          width="full"
        >
          Update Customer
        </Button>
      </VStack>
    </form>
  );
};

export default EditCustomerInfo;