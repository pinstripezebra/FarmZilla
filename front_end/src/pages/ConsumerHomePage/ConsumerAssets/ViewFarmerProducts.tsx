import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Text,
  Avatar,
  Flex,
  Badge,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Heading,
  Icon,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ArrowBackIcon, EmailIcon, PhoneIcon, StarIcon } from "@chakra-ui/icons";
import apiClient from "../../../services/apli-client";
import FarmerReviews from "../../../components/FarmerReviews";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  image_url?: string;
  user_id?: string;
}

interface ViewFarmerProductsProps {
  producer: Producer;
  onBack: () => void;
}

const ViewFarmerProducts: React.FC<ViewFarmerProductsProps> = ({ producer, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const toast = useToast();

  // Fetch products for the specific farmer
  const fetchFarmerProducts = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiClient.get(`/v1/products/user/${producer.id}`);
      setProducts(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch farmer's products";
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

  // Fetch ratings for the producer to calculate average (for header display)
  const fetchProducerRatings = async () => {
    try {
      const response = await apiClient.get(`/v1/ratings/?producer_id=${producer.id}`);
      const ratings = response.data;
      
      if (ratings && ratings.length > 0) {
        const totalRating = ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0);
        const average = totalRating / ratings.length;
        setAverageRating(Math.round(average * 10) / 10); // Round to 1 decimal place
        setTotalReviews(ratings.length);
      } else {
        setAverageRating(null);
        setTotalReviews(0);
      }
    } catch (err: any) {
      console.error("Failed to fetch producer ratings:", err);
      setAverageRating(null);
      setTotalReviews(0);
    }
  };

  useEffect(() => {
    fetchFarmerProducts();
    fetchProducerRatings();
  }, [producer.id]);

  const handleAddToCart = (product: Product) => {
    console.log("Add to cart:", product.product_name);
    toast({
      title: "Added to Cart",
      description: `${product.product_name} has been added to your cart.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleImageError = (product: Product) => {
    console.error(`Failed to load image for ${product.product_name}:`, product.image_url);
  };

  const handleImageLoad = (product: Product) => {
    console.log(`Successfully loaded image for ${product.product_name}:`, product.image_url);
  };



  if (isLoading) {
    return (
      <Box p={6}>
        <Button leftIcon={<ArrowBackIcon />} onClick={onBack} mb={6} variant="ghost">
          Back to Farmers
        </Button>
        <Skeleton height="120px" mb={6} borderRadius="md" />
        <Skeleton height="40px" mb={4} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Back Button */}
      <Button 
        leftIcon={<ArrowBackIcon />} 
        onClick={onBack} 
        mb={6} 
        variant="ghost"
        colorScheme="teal"
      >
        Back to Farmers
      </Button>

      {/* Farmer Information Card */}
      <Card mb={6} shadow="lg" borderRadius="xl">
        <CardHeader pb={2}>
          <Flex align="center" gap={4}>
            <Avatar 
              size="xl" 
              name={producer.username}
              bg="teal.500"
              color="white"
            />
            <Box flex="1">
              <Heading size="lg" color="teal.600" mb={2}>
                {producer.username}
              </Heading>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={EmailIcon} color="gray.500" />
                  <Text color="gray.600" fontSize="sm">
                    {producer.email}
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={PhoneIcon} color="gray.500" />
                  <Text color="gray.600" fontSize="sm">
                    (555) 123-4567
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
                {products.length} Products
              </Badge>
            </VStack>
          </Flex>
        </CardHeader>
        <CardBody pt={2}>
          <Text color="gray.600" fontSize="sm">
            Welcome to {producer.username}'s farm! We specialize in fresh, locally grown produce 
            using sustainable farming practices. All our products are harvested at peak ripeness 
            to ensure the best quality and flavor for our customers.
          </Text>
        </CardBody>
      </Card>

      {/* Products Section */}
      <Box>
        <Heading size="md" mb={4} color="teal.600">
          Available Products
        </Heading>

        {error && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Error loading products!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {!error && products.length === 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>No products available</AlertTitle>
              <AlertDescription>
                This farmer doesn't have any products listed at the moment. Please check back later.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {!error && products.length > 0 && (
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th>Image</Th>
                  <Th>Product Name</Th>
                  <Th>Description</Th>
                  <Th>Action</Th>
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
                      <Text fontWeight="medium" color="teal.600">
                        {product.product_name}
                      </Text>
                    </Td>
                    <Td>
                      <Text 
                        noOfLines={3} 
                        maxWidth="400px"
                        fontSize="sm"
                        color="gray.600"
                      >
                        {product.description}
                      </Text>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="teal"
                        variant="solid"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Reviews Section */}
      <Box mt={8}>
        <FarmerReviews 
          producer={{ id: producer.id, username: producer.username }} 
          showReviewButton={true}
          title="Customer Reviews"
        />
      </Box>
    </Box>
  );
};

export default ViewFarmerProducts;
