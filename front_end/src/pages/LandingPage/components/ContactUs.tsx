import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  Flex,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle sending the form data
    alert("Thanks for reaching out! We'll help you connect with local producers soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <Box py={10} px={4} textAlign="center" maxW="600px" mx="auto">
    <Heading
        as="h2"
        size="xl"
        mb={2}
        position="relative"
        display="inline-block"
        textAlign="center"
        width="100%"
    >
        Contact Us
        <Box
            height="4px"
            width="60px"
            bg="teal.400"
            borderRadius="2px"
            position="absolute"
            left="50%"
            bottom="-8px"
            transform="translateX(-50%)"
        />
    </Heading>
      <Box height="18px" />
      <Text textAlign="center" mb={8}>
        Have questions about local producers or need help finding fresh produce? 
        Contact us and we'll connect you with the right farmers in your area.
      </Text>
      <form onSubmit={handleSubmit}>
        <Flex gap={4} mb={4}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email"
            />
          </FormControl>
        </Flex>
        <FormControl isRequired mb={6}>
          <FormLabel>Message</FormLabel>
          <Textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows={6}
          />
        </FormControl>
        <Button colorScheme="teal" type="submit" width="100%">
          Send Message
        </Button>
      </form>
    </Box>
  );
};

export default ContactUs;