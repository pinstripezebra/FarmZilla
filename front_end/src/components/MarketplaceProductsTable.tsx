import React, { useState, useEffect } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
  Text,
  Box,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
} from "@chakra-ui/react";
import { productService } from "../services/productService";
import apiClient from "../services/apli-client";

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  image_url?: string;
  user_id?: string;
  username?: string;
}

interface MarketplaceProductsTableProps {
  loading?: boolean;
  error?: string;
}

const MarketplaceProductsTable: React.FC<MarketplaceProductsTableProps> = ({ loading, error }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [followedProducers, setFollowedProducers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  const toast = useToast();

  // Function to fetch username by user_id
  const fetchUsername = async (userId: string): Promise<string> => {
    try {
      const response = await apiClient.get(`/v1/user/${userId}/username`);
      return response.data.username;
    } catch (error) {
      console.error(`Failed to fetch username for user ${userId}:`, error);
      return "Unknown Producer";
    }
  };

  const fetchAllProducts = async () => {
    setIsLoading(true);
    setFetchError("");
    
    try {
      // Fetch all products from all producers
      const response = await productService.getAllProducts();
      
      // Fetch usernames for each product
      const productsWithUsernames = await Promise.all(
        response.map(async (product: Product) => {
          if (product.user_id) {
            const username = await fetchUsername(product.user_id);
            return { ...product, username };
          }
          return { ...product, username: "Unknown Producer" };
        })
      );
      
      setProducts(productsWithUsernames);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch marketplace products";
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
    const currentUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    if (!currentUserId) return;

    try {
      const response = await apiClient.get(`/v1/producer_consumer_matches/?consumer_id=${currentUserId}`);
      const followedProducerIds = new Set<string>(response.data.map((match: any) => String(match.producer_id)));
      setFollowedProducers(followedProducerIds);
    } catch (error) {
      console.error("Failed to fetch followed producers:", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    fetchFollowedProducers();
  }, []);

  const handleAddToCart = (product: Product) => {
    // Placeholder for add to cart functionality
    console.log("Add to cart:", product.product_name);
    toast({
      title: "Added to Cart",
      description: `${product.product_name} has been added to your cart.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleFollowProducer = async (product: Product) => {
    if (!product.user_id) {
      toast({
        title: "Error",
        description: "Unable to follow producer: Producer ID not available",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Get current consumer ID from localStorage (assuming it's stored there)
    const currentUserId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to follow producers",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Add producer to following in progress set
    setFollowingInProgress(prev => new Set(prev).add(product.user_id!));

    try {
      const response = await apiClient.post(`/v1/producer_consumer_matches/?producer_id=${product.user_id}&consumer_id=${currentUserId}`);
      
      if (response.status === 200) {
        // Add to followed producers set
        setFollowedProducers(prev => new Set(prev).add(product.user_id!));
        
        toast({
          title: "Success",
          description: `You are now following ${product.username || "this producer"}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to follow producer";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      // Remove producer from following in progress set
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.user_id!);
        return newSet;
      });
    }
  };

  const handleImageError = (product: Product) => {
    console.error(`Failed to load image for ${product.product_name}:`, product.image_url);
  };

  const handleImageLoad = (product: Product) => {
    console.log(`Successfully loaded image for ${product.product_name}:`, product.image_url);
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
          <AlertTitle>Error loading products!</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>No products available</AlertTitle>
          <AlertDescription>
            No products are currently available in the marketplace.
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
            <Th>Image</Th>
            <Th>Product Name</Th>
            <Th>Description</Th>
            <Th>Producer</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product.id}>
              <Td>
                <Box width="80px" height="80px">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.product_name}
                      width="80px"
                      height="80px"
                      objectFit="cover"
                      borderRadius="md"
                      onError={() => handleImageError(product)}
                      onLoad={() => handleImageLoad(product)}
                      fallback={
                        <Box
                          width="80px"
                          height="80px"
                          bg="gray.200"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="md"
                        >
                          <Text fontSize="xs" color="gray.500">
                            Loading...
                          </Text>
                        </Box>
                      }
                    />
                  ) : (
                    <Box
                      width="80px"
                      height="80px"
                      bg="gray.200"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="md"
                    >
                      <Text fontSize="xs" color="gray.500">
                        No Image
                      </Text>
                    </Box>
                  )}
                </Box>
              </Td>
              <Td>
                <Text fontWeight="medium">{product.product_name}</Text>
              </Td>
              <Td>
                <Text 
                  noOfLines={3} 
                  maxWidth="300px"
                  fontSize="sm"
                  color="gray.600"
                >
                  {product.description}
                </Text>
              </Td>
              <Td>
                <Text fontSize="sm" color="teal.600" fontWeight="medium">
                  {product.username || "Unknown Producer"}
                </Text>
              </Td>
              <Td>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    size="sm"
                    colorScheme="teal"
                    variant="solid"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={followedProducers.has(product.user_id || '') ? "green" : "blue"}
                    variant={followedProducers.has(product.user_id || '') ? "solid" : "outline"}
                    onClick={() => handleFollowProducer(product)}
                    isLoading={followingInProgress.has(product.user_id || '')}
                    isDisabled={followedProducers.has(product.user_id || '') || !product.user_id}
                  >
                    {followedProducers.has(product.user_id || '') ? "Following" : "Follow"}
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

export default MarketplaceProductsTable;