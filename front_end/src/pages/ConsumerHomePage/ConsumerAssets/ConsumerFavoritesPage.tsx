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
  Heading,
  Flex,
} from "@chakra-ui/react";
import { matchService, type ProducerConsumerMatch } from "../../../services/matchService";
import apiClient from "../../../services/apli-client";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
  productCount: number;
  followedDate?: string;
}

const ConsumerFavoritesPage: React.FC = () => {
  const [followedProducers, setFollowedProducers] = useState<Producer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [unfollowingInProgress, setUnfollowingInProgress] = useState<Set<string>>(new Set());
  const toast = useToast();

  // Function to fetch producer details by ID
  const fetchProducerDetails = async (producerId: string): Promise<Producer | null> => {
    try {
      const response = await apiClient.get(`/v1/user/?user_id=${producerId}`);
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch producer details for ${producerId}:`, error);
      return null;
    }
  };

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

  // Function to fetch followed producers
  const fetchFollowedProducers = async () => {
    const currentUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    
    if (!currentUserId) {
      setError("Please log in to view your followed producers.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get all matches for the current consumer
      const matches = await matchService.getMatchesForConsumer(currentUserId);
      
      if (matches.length === 0) {
        setFollowedProducers([]);
        return;
      }

      // Fetch detailed producer information for each match
      const producerDetailsPromises = matches.map(async (match: ProducerConsumerMatch) => {
        const producerDetails = await fetchProducerDetails(match.producer_id);
        if (producerDetails) {
          const productCount = await fetchProductCount(match.producer_id);
          return {
            ...producerDetails,
            productCount,
            followedDate: match.created_at
          };
        }
        return null;
      });

      const producerDetails = await Promise.all(producerDetailsPromises);
      const validProducers: Producer[] = producerDetails
        .filter((producer): producer is NonNullable<typeof producer> => producer !== null)
        .map(producer => ({ ...producer, productCount: producer.productCount }));
      
      // Sort by followed date (most recent first)
      validProducers.sort((a, b) => {
        if (a.followedDate && b.followedDate) {
          return new Date(b.followedDate).getTime() - new Date(a.followedDate).getTime();
        }
        return 0;
      });

      setFollowedProducers(validProducers);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch followed producers";
      setError(errorMessage);
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

  // Function to handle unfollowing a producer
  const handleUnfollowProducer = async (producer: Producer) => {
    const currentUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to unfollow producers.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Add to in-progress set to show loading
    setUnfollowingInProgress(prev => new Set(prev).add(producer.id));

    try {
      await matchService.deleteMatch(producer.id, currentUserId);
      
      // Remove from followed producers list
      setFollowedProducers(prev => prev.filter(p => p.id !== producer.id));
      
      toast({
        title: "Successfully Unfollowed!",
        description: `You have unfollowed ${producer.username}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to unfollow producer";
      toast({
        title: "Unfollow Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Remove from in-progress set
      setUnfollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(producer.id);
        return newSet;
      });
    }
  };

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

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  useEffect(() => {
    fetchFollowedProducers();
  }, []);

  if (isLoading) {
    return (
      <Box p={4}>
        <Heading size="lg" mb={6} color="teal.600">My Followed Producers</Heading>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Heading size="lg" mb={6} color="teal.600">My Followed Producers</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading followed producers!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (followedProducers.length === 0) {
    return (
      <Box p={4}>
        <Heading size="lg" mb={6} color="teal.600">My Followed Producers</Heading>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No followed producers</AlertTitle>
            <AlertDescription>
              You haven't followed any producers yet. Browse the Farmers section to find producers to follow.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="teal.600">My Followed Producers</Heading>
        <Badge colorScheme="teal" fontSize="md" px={3} py={1}>
          {followedProducers.length} Producer{followedProducers.length !== 1 ? 's' : ''} Followed
        </Badge>
      </Flex>
      
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Producer Name</Th>
              <Th>Email</Th>
              <Th>Products Available</Th>
              <Th>Followed Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {followedProducers.map((producer) => (
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
                  <Text fontSize="sm" color="gray.500">
                    {formatDate(producer.followedDate)}
                  </Text>
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
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleUnfollowProducer(producer)}
                      isLoading={unfollowingInProgress.has(producer.id)}
                    >
                      Unfollow
                    </Button>
                  </Box>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ConsumerFavoritesPage;
