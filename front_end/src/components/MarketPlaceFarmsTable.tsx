import React, { useState, useEffect, useRef } from "react";
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
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { CheckIcon, StarIcon } from "@chakra-ui/icons";
import apiClient from "../services/apli-client";
import { useUser } from "../context/UserContex";

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
  onViewProducts?: (producer: Producer) => void;
}

const MarketPlaceFarmsTable: React.FC<MarketPlaceFarmsTableProps> = ({ loading, error, onViewProducts }) => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [followedProducers, setFollowedProducers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [followersCount, setFollowersCount] = useState<Record<string, number>>({});
  const [averageRatings, setAverageRatings] = useState<Record<string, number | null>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { user } = useUser();

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

      // Fetch follower counts for each producer
      try {
        const followerCountsArray = await Promise.all(
          producersWithCounts.map(async (p: Producer) => {
            try {
              const res = await apiClient.get(`/v1/producer_consumer_matches/?producer_id=${p.id}`);
              return { id: p.id, count: Array.isArray(res.data) ? res.data.length : 0 };
            } catch (e) {
              console.error(`Failed to fetch followers for producer ${p.id}:`, e);
              return { id: p.id, count: 0 };
            }
          })
        );

        const countsMap: Record<string, number> = {};
        followerCountsArray.forEach(item => {
          countsMap[item.id] = item.count;
        });
        setFollowersCount(countsMap);
      } catch (e) {
        console.error("Failed to fetch follower counts:", e);
      }

      // Fetch average ratings for each producer
      try {
        const ratingsArray = await Promise.all(
          producersWithCounts.map(async (p: Producer) => {
            try {
              const res = await apiClient.get(`/v1/ratings/?producer_id=${p.id}`);
              if (Array.isArray(res.data) && res.data.length > 0) {
                const totalRating = res.data.reduce((sum: number, rating: any) => sum + rating.rating, 0);
                const average = totalRating / res.data.length;
                return { id: p.id, average: Math.round(average * 10) / 10 }; // Round to 1 decimal
              }
              return { id: p.id, average: null };
            } catch (e) {
              console.error(`Failed to fetch ratings for producer ${p.id}:`, e);
              return { id: p.id, average: null };
            }
          })
        );

        const ratingsMap: Record<string, number | null> = {};
        ratingsArray.forEach(item => {
          ratingsMap[item.id] = item.average;
        });
        setAverageRatings(ratingsMap);
      } catch (e) {
        console.error("Failed to fetch producer ratings:", e);
      }
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

  // Function to fetch current user's followed producers
  const fetchFollowedProducers = async () => {
    const currentUserId = user?.id || localStorage.getItem("userId");
    if (!currentUserId) return;

    try {
      const response = await apiClient.get(`/v1/producer_consumer_matches/?consumer_id=${currentUserId}`);
      const followedProducerIds = new Set<string>(response.data.map((match: any) => String(match.producer_id)));
      setFollowedProducers(followedProducerIds);
    } catch (error) {
      console.error("Failed to fetch followed producers:", error);
    }
  };

  // Function to handle follow/unfollow button click
  const handleFollowButtonClick = (producer: Producer) => {
    if (followedProducers.has(producer.id)) {
      // If already following, show unfollow confirmation
      setSelectedProducer(producer);
      onOpen();
    } else {
      // If not following, follow the producer
      handleFollowProducer(producer);
    }
  };

  // Function to handle following a producer
  const handleFollowProducer = async (producer: Producer) => {
    const currentUserId = user?.id || localStorage.getItem("userId");
    
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow producers.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Add to in-progress set to show loading
    setFollowingInProgress(prev => new Set(prev).add(producer.id));

    try {
      await apiClient.post(`/v1/producer_consumer_matches/?producer_id=${producer.id}&consumer_id=${currentUserId}`);
      
      // Update followed producers set
      setFollowedProducers(prev => new Set(prev).add(producer.id));
      
      toast({
        title: "Successfully Followed!",
        description: `You are now following ${producer.username}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to follow producer";
      toast({
        title: "Follow Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Remove from in-progress set
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(producer.id);
        return newSet;
      });
    }
  };

  // Function to handle unfollowing a producer
  const handleUnfollowProducer = async () => {
    if (!selectedProducer) return;
    
    const currentUserId = user?.id || localStorage.getItem("userId");
    
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to unfollow producers.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      return;
    }

    // Add to in-progress set to show loading
    setFollowingInProgress(prev => new Set(prev).add(selectedProducer.id));

    try {
      await apiClient.delete(`/v1/producer_consumer_matches/?producer_id=${selectedProducer.id}&consumer_id=${currentUserId}`);
      
      // Update followed producers set
      setFollowedProducers(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedProducer.id);
        return newSet;
      });
      
      toast({
        title: "Successfully Unfollowed!",
        description: `You have unfollowed ${selectedProducer.username}`,
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
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedProducer.id);
        return newSet;
      });
      onClose();
      setSelectedProducer(null);
    }
  };

  useEffect(() => {
    fetchAllProducers();
    fetchFollowedProducers();
  }, []);

  const handleViewProducts = (producer: Producer) => {
    if (onViewProducts) {
      onViewProducts(producer);
    } else {
      // Fallback if no handler provided
      console.log("View products for:", producer.username);
      toast({
        title: "View Products",
        description: `Viewing products from ${producer.username}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
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
    <>
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Producer Name</Th>
              <Th>Email</Th>
              <Th>Avg Rating</Th>
              <Th>Followers</Th>
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
                  {averageRatings[producer.id] !== null && averageRatings[producer.id] !== undefined ? (
                    <HStack spacing={1}>
                      <Icon as={StarIcon} color="yellow.400" boxSize={3} />
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {averageRatings[producer.id]}
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400">
                      No ratings
                    </Text>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={followersCount[producer.id] && followersCount[producer.id] > 0 ? "green" : "gray"} variant="subtle" fontSize="sm" px={3} py={1}>
                    {typeof followersCount[producer.id] === "number" ? followersCount[producer.id] : 0} Followers
                  </Badge>
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
                  <Box display="flex" justifyContent="space-between" alignItems="center">
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
                      colorScheme="green"
                      variant={followedProducers.has(producer.id) ? "solid" : "outline"}
                      onClick={() => handleFollowButtonClick(producer)}
                      isLoading={followingInProgress.has(producer.id)}
                      leftIcon={followedProducers.has(producer.id) ? <CheckIcon /> : undefined}
                      _hover={{
                        bg: followedProducers.has(producer.id) ? "red.500" : "green.500",
                        color: "white",
                        borderColor: followedProducers.has(producer.id) ? "red.500" : "green.500"
                      }}
                    >
                      {followedProducers.has(producer.id) ? "Following" : "Follow"}
                    </Button>
                  </Box>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Unfollow Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Unfollow Producer
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to unfollow{" "}
              <Text as="span" fontWeight="bold" color="teal.600">
                {selectedProducer?.username}
              </Text>
              ? You will no longer receive updates about their products.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleUnfollowProducer} 
                ml={3}
                isLoading={selectedProducer ? followingInProgress.has(selectedProducer.id) : false}
              >
                Unfollow
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default MarketPlaceFarmsTable;