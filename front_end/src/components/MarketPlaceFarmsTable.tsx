import React, { useState, useEffect } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Box,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  Badge,
} from "@chakra-ui/react";
import apiClient from "../services/apli-client";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
  productCount?: number;
}

interface MarketPlaceFarmsTableProps {
  loading?: boolean;
  error?: string;
}

const MarketPlaceFarmsTable: React.FC<MarketPlaceFarmsTableProps> = ({ loading, error }) => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const toast = useToast();

  // Function to fetch product count for a specific producer
  const fetchProductCount = async (userId: string): Promise<number> => {
    try {
      const response = await apiClient.get(`/v1/products/user/${userId}`);
      return response.data.length;
    } catch (error) {
      console.error(`Failed to fetch product count for user ${userId}:`, error);
      return 0;
    }
  };

  const fetchAllProducers = async () => {
    setIsLoading(true);
    setFetchError("");
    
    try {
      // Fetch all users
      const response = await apiClient.get("/v1/users/all");
      
      // Filter for producers only
      const producerUsers = response.data.filter((user: Producer) => user.role === "producer");
      
      // Fetch product counts for each producer
      const producersWithCounts = await Promise.all(
        producerUsers.map(async (producer: Producer) => {
          const productCount = await fetchProductCount(producer.id);
          return { ...producer, productCount };
        })
      );
      
      setProducers(producersWithCounts);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch producers";
      setFetchError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducers();
  }, []);

  const handleViewProducts = (producer: Producer) => {
    // Placeholder for viewing producer's products
    console.log("View products for:", producer.username);
    toast({
      title: "View Products",
      description: `Viewing products from ${producer.username}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleContactProducer = (producer: Producer) => {
    // Placeholder for contacting producer
    console.log("Contact producer:", producer.username);
    toast({
      title: "Contact Producer",
      description: `Contacting ${producer.username} at ${producer.email}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const displayLoading = loading || isLoading;
  const displayError = error || fetchError;

  if (displayLoading) {
    return (
      <Box p={4}>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" />
      </Box>
    );
  }

  if (displayError) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Error loading producers!</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (producers.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>No producers available</AlertTitle>
          <AlertDescription>
            No producers are currently registered on the platform.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>Producer Name</Th>
            <Th>Email</Th>
            <Th>Products Available</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {producers.map((producer) => (
            <Tr key={producer.id}>
              <Td>
                <Text fontWeight="medium" color="teal.600">
                  {producer.username}
                </Text>
              </Td>
              <Td>
                <Text fontSize="sm" color="gray.600">
                  {producer.email}
                </Text>
              </Td>
              <Td>
                <Badge
                  colorScheme={producer.productCount && producer.productCount > 0 ? "green" : "gray"}
                  variant="subtle"
                  fontSize="sm"
                  px={3}
                  py={1}
                >
                  {producer.productCount || 0} Products
                </Badge>
              </Td>
              <Td>
                <Box display="flex" gap={2}>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    variant="outline"
                    onClick={() => handleViewProducts(producer)}
                    isDisabled={!producer.productCount || producer.productCount === 0}
                  >
                    View Products
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => handleContactProducer(producer)}
                  >
                    Contact
                  </Button>
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default MarketPlaceFarmsTable;