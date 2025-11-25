import { useState } from 'react';
import { Box, Button, Input, FormLabel, FormControl, Textarea, useToast } from '@chakra-ui/react';
import axios from 'axios';

const InfoForm = () => {
    const [formData, setFormData] = useState({
        education: '',
        experience: '',
        location: '',
        cv: null,
        otherInfo: '',
    });

    const toast = useToast();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'cv') {
            setFormData({ ...formData, cv: files[0] }); // Handle file upload
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSubmit = new FormData();
        
        // Append form data
        for (const key in formData) {
            formDataToSubmit.append(key, formData[key]);
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, formDataToSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast({
                title: 'Information submitted.',
                description: response.data.message || 'Successfully submitted.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            // Reset the form after successful submission
            setFormData({
                education: '',
                experience: '',
                location: '',
                cv: null,
                otherInfo: '',
            });
        } catch (error) {
            console.error('Submission error:', error);
            toast({
                title: 'Error.',
                description: error.response?.data?.message || 'An error occurred while submitting.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box maxW="600px" mx="auto" p={6} borderRadius="lg" boxShadow="lg" bg="white">
            <form onSubmit={handleSubmit}>
                <FormControl mb={4}>
                    <FormLabel htmlFor="education">Education</FormLabel>
                    <Textarea
                        id="education"
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        placeholder="Enter your education details"
                        required
                    />
                </FormControl>
                <FormControl mb={4}>
                    <FormLabel htmlFor="experience">Experience</FormLabel>
                    <Textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="Enter your work experience"
                    />
                </FormControl>
                <FormControl mb={4}>
                    <FormLabel htmlFor="location">Location</FormLabel>
                    <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter your location"
                        required
                    />
                </FormControl>
                {/* <FormControl mb={4}>
                    <FormLabel htmlFor="cv">Upload CV (PDF)</FormLabel>
                    <Input
                        id="cv"
                        type="file"
                        name="cv"
                        accept="application/pdf"
                        onChange={handleChange}
                        required
                    />
                </FormControl> */}
                <FormControl mb={4}>
                    <FormLabel htmlFor="otherInfo">Other Information</FormLabel>
                    <Textarea
                        id="otherInfo"
                        name="otherInfo"
                        value={formData.otherInfo}
                        onChange={handleChange}
                        placeholder="Enter any other relevant information"
                    />
                </FormControl>
                <Button type="submit" colorScheme="purple" w="full">
                    Submit
                </Button>
            </form>
        </Box>
    );
};

export default InfoForm;