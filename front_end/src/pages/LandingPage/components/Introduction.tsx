import React from 'react';
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../data/landing_background.png";

interface IntroductionProps {
  introData: {
    header: string;
    subtext: string;
    buttonText: string;
  };
}

const Introduction: React.FC<IntroductionProps> = ({ introData }) => {
  const navigate = useNavigate();

  return (
    <Box
      minHeight="400px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgImage={`url(${backgroundImage})`}
      bgSize="cover"
      bgPosition="center"
      borderRadius="lg"
      boxShadow="lg"
      textAlign="center"
      px={4}
      py={16}
    >
      <Heading color="white" mb={4} fontSize={{ base: "2xl", md: "4xl" }}>
        {introData.header}
      </Heading>
      <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "xl" }} mb={8}>
        {introData.subtext}
      </Text>
      <Button colorScheme="teal" size="lg" onClick={() => navigate("/Login")}>
        {introData.buttonText}
      </Button>
    </Box>
  );
};

export default Introduction;