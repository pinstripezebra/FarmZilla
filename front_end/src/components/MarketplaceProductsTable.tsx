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

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  image_url?: string;
  user_id?: string;
}

interface MarketplaceProductsTableProps {
  loading?: boolean;
  error?: string;
}

const MarketplaceProductsTable: React.FC<MarketplaceProductsTableProps> = ({ loading, error }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const toast = useToast();

  const fetchAllProducts = async () => {
    setIsLoading(true);
    setFetchError("");
    
    try {
      // Fetch all products from all producers
      const response = await productService.getAllProducts();
      setProducts(response);
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
                <Text fontSize="sm" color="gray.500">
                  Producer ID: {product.user_id?.slice(0, 8) || "Unknown"}
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
  );
};

export default MarketplaceProductsTable;