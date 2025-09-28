import React from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Image,
  UnorderedList,
  ListItem,
  VStack,
} from "@chakra-ui/react";

interface AboutUsProps {
  blurb: string;
  whyChoose: string[];
}

const AboutUs: React.FC<AboutUsProps> = ({ blurb, whyChoose }) => {
  return (
    <Box py={10} px={4} maxW="1200px" mx="auto">
    <Box textAlign="center"  >
      <Heading
        as="h2"
        size="xl"
        mb={2}
        position="relative"
        display="inline-block"
      >
        About Us
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
      <Box height="18px" />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
        {/* Left: Image */}
        <Box display="flex" justifyContent="center">
          <Image
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
            alt="Board game"
            borderRadius="lg"
            boxSize={{ base: "250px", md: "350px" }}
            objectFit="cover"
            boxShadow="md"
          />
        </Box>
        {/* Right: Blurb and List */}
        <VStack align="start" spacing={5} alignContent={"left"}>
          <Text fontSize="lg">{blurb}</Text>
          <Text fontWeight="bold" mt={2}>
            Why choose Optigame?
          </Text>
          <UnorderedList pl={5} spacing={2}>
            {whyChoose.map((reason, idx) => (
              <ListItem key={idx}>{reason}</ListItem>
            ))}
          </UnorderedList>
        </VStack>
      </SimpleGrid>
    </Box>
  );
};

export default AboutUs;