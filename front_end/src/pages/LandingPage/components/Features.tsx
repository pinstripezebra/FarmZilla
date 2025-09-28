import React from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  VStack,
  Image,
  Text,
} from "@chakra-ui/react";

interface Feature {
  image: string;
  title: string;
  text: string;
}

interface FeaturesProps {
  features: Feature[];
}

const Features: React.FC<FeaturesProps> = ({ features }) => (
  <Box py={10} px={4} bg="gray.50">
    <Box textAlign="center" mb={8}>
    <Heading
      as="h2"
      size="xl"
      mb={2}
      position="relative"
      display="inline-block"
    >
      Features
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
    </Box>
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
      {features.map((feature, idx) => (
        <VStack key={idx} spacing={4} align="center">
          <Image
            src={feature.image}
            alt={feature.title}
            boxSize="96px"
            borderRadius="full"
            objectFit="cover"
            bg="gray.100"
          />
          <Text fontWeight="bold" fontSize="lg" textAlign="center">
            {feature.title}
          </Text>
          <Text color="gray.600" textAlign="center">
            {feature.text}
          </Text>
        </VStack>
      ))}
    </SimpleGrid>
  </Box>
);

export default Features;