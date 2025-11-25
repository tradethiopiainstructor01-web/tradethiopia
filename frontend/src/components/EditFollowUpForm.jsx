import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Input, Textarea, useToast } from '@chakra-ui/react';
import axios from 'axios';

const EditFollowUpForm = ({ followUp, onClose }) => {
  const [formData, setFormData] = useState({
    clientName: followUp.clientName || followUp.fullName || '',
    email: followUp.email || '',
    phoneNumber: followUp.phoneNumber || '',
    deadline: followUp.deadline || followUp.followUpDate || '',
    serviceProvided: followUp.serviceProvided || '',
    serviceNotProvided: followUp.serviceNotProvided || '',
    notes: followUp.notes || ''
  });
  
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map frontend fields to backend fields
      const backendData = {
        clientName: formData.clientName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        deadline: formData.deadline,
        serviceProvided: formData.serviceProvided,
        serviceNotProvided: formData.serviceNotProvided
      };
      
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${followUp._id}/edit`, backendData);
      
      toast({
        title: 'Success',
        description: 'Follow-up updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose(); // Close the modal after successful edit
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl mb={4}>
        <FormLabel>Full Name</FormLabel>
        <Input 
          name="clientName" 
          value={formData.clientName} 
          onChange={handleChange} 
          required 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Email</FormLabel>
        <Input 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Phone Number</FormLabel>
        <Input 
          name="phoneNumber" 
          value={formData.phoneNumber} 
          onChange={handleChange} 
          required 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Follow-Up Date</FormLabel>
        <Input 
          type="date" 
          name="deadline" 
          value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''} 
          onChange={handleChange} 
          required 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Service Provided</FormLabel>
        <Input 
          name="serviceProvided" 
          value={formData.serviceProvided} 
          onChange={handleChange} 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Service Not Provided</FormLabel>
        <Input 
          name="serviceNotProvided" 
          value={formData.serviceNotProvided} 
          onChange={handleChange} 
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Notes</FormLabel>
        <Textarea 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
        />
      </FormControl>
      <Button colorScheme="teal" type="submit">Save Changes</Button>
    </form>
  );
};

export default EditFollowUpForm;