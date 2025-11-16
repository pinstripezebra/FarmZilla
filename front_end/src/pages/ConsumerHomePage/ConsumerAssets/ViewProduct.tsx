import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Divider,
  Box,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import type { Product } from '../../../services/productService';

interface ProductWithProducer extends Product {
  producer_name?: string;
  producer_rating?: number;
  total_reviews?: number;
}

interface ViewProductProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithProducer | null;
}

const ViewProduct: React.FC<ViewProductProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const renderRatingStars = (rating: number, totalReviews: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} color="yellow.400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} color="yellow.400" />); // Could add half-star logic here
      } else {
        stars.push(<StarIcon key={i} color="gray.300" />);
      }
    }

    return (
      <HStack spacing={1}>
        <HStack spacing={0.5}>
          {stars}
        </HStack>
        <Text fontSize="sm" color="gray.600">
          ({rating.toFixed(1)})
        </Text>
        <Text fontSize="xs" color="gray.500">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </Text>
      </HStack>
    );
  };

  if (!product) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg={bgColor} border="1px solid" borderColor={borderColor}>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="teal.600">
              {product.product_name}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Product ID: {product.product_id}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Product Image */}
            {product.image_url && (
              <Box>
                <Image
                  src={product.image_url}
                  alt={product.product_name}
                  width="100%"
                  maxHeight="300px"
                  objectFit="cover"
                  borderRadius="lg"
                  fallbackSrc="https://via.placeholder.com/400x300?text=No+Image+Available"
                />
              </Box>
            )}

            {/* Product Details */}
            <VStack align="stretch" spacing={4}>
              {/* Description */}
              <Box>
                <Heading size="md" mb={2} color="gray.700">
                  Description
                </Heading>
                <Text color="gray.600" lineHeight="tall">
                  {product.description || "No description available."}
                </Text>
              </Box>

              <Divider />

              {/* Price and Unit */}
              <Box>
                <Heading size="md" mb={3} color="gray.700">
                  Pricing
                </Heading>
                <HStack spacing={4}>
                  {product.cost && (
                    <Badge colorScheme="green" fontSize="lg" px={3} py={1}>
                      ${product.cost.toFixed(2)}
                      {product.unit && ` / ${product.unit}`}
                    </Badge>
                  )}
                  {!product.cost && (
                    <Text fontSize="md" color="gray.500">
                      Price not specified
                    </Text>
                  )}
                </HStack>
              </Box>

              <Divider />

              {/* Producer Information */}
              <Box>
                <Heading size="md" mb={3} color="gray.700">
                  Producer Information
                </Heading>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold" color="gray.700">
                      Producer:
                    </Text>
                    <Text color="teal.600" fontWeight="medium">
                      {product.producer_name || `Producer ${product.user_id?.toString().slice(-4) || 'Unknown'}`}
                    </Text>
                  </HStack>

                  {/* Producer Rating */}
                  <HStack justify="space-between" align="start">
                    <Text fontWeight="semibold" color="gray.700">
                      Rating:
                    </Text>
                    <Box textAlign="right">
                      {product.total_reviews && product.total_reviews > 0 ? (
                        renderRatingStars(product.producer_rating || 0, product.total_reviews)
                      ) : (
                        <Text fontSize="sm" color="gray.500">No reviews yet</Text>
                      )}
                    </Box>
                  </HStack>

                  {product.user_id && (
                    <HStack justify="space-between">
                      <Text fontWeight="semibold" color="gray.700">
                        Producer ID:
                      </Text>
                      <Text fontSize="sm" color="gray.500" fontFamily="mono">
                        {product.user_id.toString().slice(0, 8)}...
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Additional Product Details */}
              {(product.unit || product.id) && (
                <>
                  <Divider />
                  <Box>
                    <Heading size="md" mb={3} color="gray.700">
                      Product Details
                    </Heading>
                    <VStack align="stretch" spacing={2}>
                      {product.unit && (
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" color="gray.700">
                            Unit:
                          </Text>
                          <Text color="gray.600">
                            {product.unit}
                          </Text>
                        </HStack>
                      )}
                      {product.id && (
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" color="gray.700">
                            Internal ID:
                          </Text>
                          <Text fontSize="sm" color="gray.500" fontFamily="mono">
                            {product.id.toString().slice(0, 8)}...
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ViewProduct;