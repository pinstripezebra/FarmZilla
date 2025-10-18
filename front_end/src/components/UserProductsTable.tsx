import React from "react";
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
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { productService } from "../services/productService";

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  image_url?: string;
  user_id?: string;
}

interface UserProductsTableProps {
  products: Product[];
  loading?: boolean;
  error?: string;
  onProductDeleted?: () => void;
}

const UserProductsTable: React.FC<UserProductsTableProps> = ({
  products,
  loading = false,
  error,
  onProductDeleted,
}) => {
  const toast = useToast();
  const [deleteProductId, setDeleteProductId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleDeleteClick = (productId: string) => {
    setDeleteProductId(productId);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(deleteProductId);
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onProductDeleted?.(); // Refresh the products list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error deleting product",
        description: "There was an error deleting the product. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
      onClose();
    }
  };
  // Debug: Print image URLs to console
  React.useEffect(() => {
    console.log("UserProductsTable - Products received:", products);
    products.forEach((product, index) => {
      console.log(`Product ${index + 1} (${product.product_name}):`, {
        id: product.id,
        product_id: product.product_id,
        image_url: product.image_url,
        has_image: !!product.image_url
      });
      
      // Test if we can fetch the image
      if (product.image_url) {
        console.log(`Testing image access for: ${product.image_url}`);
        fetch(product.image_url, { method: 'HEAD' })
          .then(response => {
            console.log(`Image ${product.product_name} - Status: ${response.status}`);
            if (!response.ok) {
              console.error(`Image access failed for ${product.product_name}:`, response.status, response.statusText);
            }
          })
          .catch(error => {
            console.error(`Image fetch error for ${product.product_name}:`, error);
          });
      }
    });
  }, [products]);

  const handleImageError = (product: Product) => {
    console.error(`Failed to load image for ${product.product_name}:`, product.image_url);
    console.log('Image error details:', {
      url: product.image_url,
      product: product.product_name,
      timestamp: new Date().toISOString()
    });
  };

  const handleImageLoad = (product: Product) => {
    console.log(`Successfully loaded image for ${product.product_name}:`, product.image_url);
  };

  if (loading) {
    return (
      <Box p={4}>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" mb={2} />
        <Skeleton height="60px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Error loading products!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>No products found</AlertTitle>
          <AlertDescription>
            You haven't added any products yet. Use the "Add Products" button to get started!
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
            <Th>Product ID</Th>
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
                <Text fontSize="sm" fontFamily="mono" color="gray.500">
                  {product.product_id}
                </Text>
              </Td>
              <Td>
                <IconButton
                  aria-label="Delete product"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleDeleteClick(product.id)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Product
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </TableContainer>
  );
};

export default UserProductsTable;