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
  onViewProducer?: (producer: { id: string; username: string; email: string; role: string }) => void;
}

const MarketplaceProductsTable: React.FC<MarketplaceProductsTableProps> = ({ loading, error, onViewProducer }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const itemsPerPage = 10;
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
      
      setAllProducts(productsWithUsernames);
      // Set initial page products (first 10)
      setProducts(productsWithUsernames.slice(0, itemsPerPage));
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

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    const startIndex = nextPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    if (startIndex < allProducts.length) {
      setCurrentPage(nextPage);
      setProducts(allProducts.slice(startIndex, endIndex));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      const startIndex = prevPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      setCurrentPage(prevPage);
      setProducts(allProducts.slice(startIndex, endIndex));
    }
  };

  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handleViewProducer = (product: Product) => {
    if (onViewProducer && product.user_id) {
      // Create producer object from product data
      const producer = {
        id: product.user_id,
        username: product.username || "Unknown Producer",
        email: "", // We don't have email in product data, could fetch if needed
        role: "producer"
      };
      onViewProducer(producer);
    }
  };

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
    <Box>
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Image</Th>
              <Th>Product Name</Th>
              <Th>Description</Th>
              <Th>Producer</Th>
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
                  <Text 
                    fontSize="sm" 
                    color="teal.600" 
                    fontWeight="medium"
                    cursor="pointer"
                    textDecoration="underline"
                    _hover={{ color: "teal.800", textDecoration: "none" }}
                    onClick={() => handleViewProducer(product)}
                  >
                    {product.username || "Unknown Producer"}
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
      
      {/* Pagination Controls */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mt={4} 
        px={4}
      >
        <Text fontSize="sm" color="gray.600">
          Showing {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, allProducts.length)} of {allProducts.length} products
        </Text>
        <Box display="flex" gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevPage}
            isDisabled={!hasPrevPage}
          >
            Previous
          </Button>
          <Text fontSize="sm" color="gray.600" alignSelf="center" px={3}>
            Page {currentPage + 1} of {totalPages}
          </Text>
          <Button
            size="sm"
            colorScheme="teal"
            variant="outline"
            onClick={handleNextPage}
            isDisabled={!hasNextPage}
          >
            Next Page
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MarketplaceProductsTable;