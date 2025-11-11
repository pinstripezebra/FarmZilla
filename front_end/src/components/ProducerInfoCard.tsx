import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Text,
  Avatar,
  Flex,
  Badge,
  Box,
  Heading,
  Icon,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { EmailIcon, PhoneIcon, StarIcon } from "@chakra-ui/icons";
import apiClient from "../services/apli-client";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
  phone_number?: string;
}

interface ProducerInfoCardProps {
  producer: Producer;
  averageRating?: number | null;
  totalReviews?: number;
  productsCount?: number;
  showDescription?: boolean;
  mb?: number | string;
}

const ProducerInfoCard: React.FC<ProducerInfoCardProps> = ({
  producer,
  averageRating = null,
  totalReviews = 0,
  productsCount = 0,
  showDescription = true,
  mb = 6
}) => {
  const [producerDetails, setProducerDetails] = useState<Producer>(producer);

  // Fetch full producer details including phone number
  const fetchProducerDetails = async () => {
    try {
      const response = await apiClient.get(`/v1/user/?user_id=${producer.id}`);
      if (response.data && response.data.length > 0) {
        setProducerDetails(response.data[0]);
      }
    } catch (err: any) {
      console.error("Failed to fetch producer details:", err);
      // Keep using the passed producer data as fallback
      setProducerDetails(producer);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have phone number data
    if (!producer.phone_number) {
      fetchProducerDetails();
    } else {
      setProducerDetails(producer);
    }
  }, [producer.id, producer.phone_number]);

  return (
    <Card mb={mb} shadow="lg" borderRadius="xl">
      <CardHeader pb={2}>
        <Flex align="center" gap={4}>
          <Avatar 
            size="xl" 
            name={producerDetails.username}
            bg="teal.500"
            color="white"
          />
          <Box flex="1">
            <Heading size="lg" color="teal.600" mb={2}>
              {producerDetails.username}
            </Heading>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={EmailIcon} color="gray.500" />
                <Text color="gray.600" fontSize="sm">
                  {producerDetails.email}
                </Text>
              </HStack>
              <HStack>
                <Icon as={PhoneIcon} color="gray.500" />
                <Text color="gray.600" fontSize="sm">
                  {producerDetails.phone_number || "Phone not available"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={StarIcon} color="yellow.400" />
                <Text color="gray.600" fontSize="sm">
                  {averageRating !== null 
                    ? `${averageRating} Rating (${totalReviews} review${totalReviews !== 1 ? 's' : ''}) • Local Farm`
                    : "No ratings yet • Local Farm"
                  }
                </Text>
              </HStack>
            </VStack>
          </Box>
          <VStack align="end" spacing={2}>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              Verified Producer
            </Badge>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              {productsCount} Products
            </Badge>
          </VStack>
        </Flex>
      </CardHeader>
      {showDescription && (
        <CardBody pt={2}>
          <Text color="gray.600" fontSize="sm">
            Welcome to {producerDetails.username}'s farm! We specialize in fresh, locally grown produce 
            using sustainable farming practices. All our products are harvested at peak ripeness 
            to ensure the best quality and flavor for our customers.
          </Text>
        </CardBody>
      )}
    </Card>
  );
};

export default ProducerInfoCard;