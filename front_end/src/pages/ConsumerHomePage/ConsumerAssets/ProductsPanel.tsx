import React, { useState, useEffect } from 'react';
import { 
  Box, VStack, Card, CardBody, Heading, Text, Button, 
  HStack, Badge, Spinner, Alert, AlertIcon, Image, 
  Divider, IconButton, Collapse, useDisclosure
} from '@chakra-ui/react';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import { productService, type Product } from '../../../services/productService';
import { ratingService } from '../../../services/ratingService';
import { eventService } from '../../../services/eventService';

interface ProductWithProducer extends Product {
  producer_name?: string;
  producer_rating?: number;
  total_reviews?: number;
}

interface ProductsPanelProps {
  searchQuery?: string;
  onProductSelect?: (product: ProductWithProducer) => void;
  height?: string;
  selectedEventId?: string | null; // Filter products by event
  onClearEventSelection?: () => void; // Callback to clear event selection
}

const ProductsPanel: React.FC<ProductsPanelProps> = ({ 
  searchQuery = "", 
  onProductSelect,
  height = "100%",
  selectedEventId,
  onClearEventSelection 
}) => {
  const [products, setProducts] = useState<ProductWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [eventProducers, setEventProducers] = useState<string[]>([]); // Producer IDs for selected event
  const { isOpen: isExpanded, onToggle } = useDisclosure({ defaultIsOpen: true });


  const fetchProductsAndRatings = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all products
      const productsData = await productService.getAllProducts();
      
      // Get unique producer IDs
      const producerIds = [...new Set(productsData.map((p: Product) => p.user_id).filter(Boolean) as string[])];
      
      // Fetch ratings for all producers
      const ratingsMap = await ratingService.getProducersRatingSummary(producerIds);
      
      // Enhance products with producer information and ratings
      const enhancedProducts: ProductWithProducer[] = productsData.map((product: Product) => {
        const rating = ratingsMap.get(product.user_id || "");
        return {
          ...product,
          producer_rating: rating?.average_rating || 0,
          total_reviews: rating?.total_reviews || 0,
          // We'll need to fetch producer names separately or join in the API
          producer_name: `Producer ${product.user_id?.slice(-4) || 'Unknown'}`
        };
      });

      // Sort by producer rating (highest first), then by product name
      const sortedProducts = enhancedProducts.sort((a, b) => {
        if (b.producer_rating !== a.producer_rating) {
          return (b.producer_rating || 0) - (a.producer_rating || 0);
        }
        return (a.product_name || "").localeCompare(b.product_name || "");
      });

      setProducts(sortedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndRatings();
  }, []);

  // Fetch event vendors when selected event changes
  useEffect(() => {
    const fetchEventProducers = async () => {
      if (selectedEventId) {
        try {
          const vendors = await eventService.getEventVendorsByEventId(selectedEventId);
          setEventProducers(vendors.map(vendor => vendor.producer_id));
        } catch (error) {
          console.error('Error fetching event vendors:', error);
          setEventProducers([]);
        }
      } else {
        setEventProducers([]);
      }
    };

    fetchEventProducers();
  }, [selectedEventId]);

  // Filter products based on search query and selected event
  const filteredProducts = products.filter(product => {
    // First filter by search query
    const matchesSearch = 
      product.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.producer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then filter by selected event (if any)
    const matchesEvent = !selectedEventId || eventProducers.includes(product.user_id || "");
    
    return matchesSearch && matchesEvent;
  });

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

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={height} p={4}>
        <Spinner size="lg" color="teal.500" />
        <Text mt={3} color="gray.600">Loading products...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box height={height} p={4}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      height={height} 
      display="flex" 
      flexDirection="column"
      bg="white"
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      minWidth={isExpanded ? "400px" : "60px"}
      maxWidth={isExpanded ? "500px" : "60px"}
      transition="all 0.3s ease"
    >
      {/* Header with toggle button */}
      <HStack 
        justify="space-between" 
        align="center" 
        p={3}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        borderRadius="md md 0 0"
      >
        <Collapse in={isExpanded} animateOpacity>
          <Heading size="md" color="teal.600">
            Products
          </Heading>
        </Collapse>
        <IconButton
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          icon={isExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          size="sm"
          variant="ghost"
          onClick={onToggle}
        />
      </HStack>

      {/* Collapsible content */}
      <Collapse in={isExpanded} animateOpacity>
        <Box 
          flex="1" 
          overflowY="auto" 
          p={4}
          maxHeight="calc(100% - 60px)"
        >
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
                {selectedEventId && ` at selected event`}
              </Text>
              
              {/* Event filter status */}
              {selectedEventId && (
                <HStack mt={2} spacing={2}>
                  <Badge colorScheme="teal" variant="subtle">
                    Event Filter Active
                  </Badge>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="gray"
                    leftIcon={<CloseIcon />}
                    onClick={onClearEventSelection}
                  >
                    Clear
                  </Button>
                </HStack>
              )}
            </Box>

            <Divider />

            {filteredProducts.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" fontSize="lg">
                  {selectedEventId
                    ? "No products available at the selected event"
                    : searchQuery 
                      ? `No products found matching "${searchQuery}"`
                      : "No products available at this time"
                  }
                </Text>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch" pb={4}>
                {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                variant="outline" 
                size="sm" 
                _hover={{ shadow: "md", borderColor: "teal.300" }}
                cursor="pointer"
                onClick={() => onProductSelect?.(product)}
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    {/* Product Image */}
                    {product.image_url && (
                      <Box>
                        <Image
                          src={product.image_url}
                          alt={product.product_name}
                          height="120px"
                          width="100%"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="https://via.placeholder.com/300x120?text=No+Image"
                        />
                      </Box>
                    )}

                    {/* Product Info */}
                    <VStack align="stretch" spacing={2}>
                      <Heading size="sm" color="teal.600">
                        {product.product_name}
                      </Heading>
                      
                      <Text fontSize="sm" color="gray.700" noOfLines={2}>
                        {product.description}
                      </Text>

                      {/* Price */}
                      {product.cost && (
                        <HStack>
                          <Badge colorScheme="green" fontSize="sm">
                            ${product.cost}{product.unit && `/${product.unit}`}
                          </Badge>
                        </HStack>
                      )}

                      <Divider />

                      {/* Producer Info */}
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          From: {product.producer_name}
                        </Text>
                        
                        {product.total_reviews && product.total_reviews > 0 ? (
                          renderRatingStars(product.producer_rating || 0, product.total_reviews)
                        ) : (
                          <Text fontSize="xs" color="gray.500">No reviews yet</Text>
                        )}
                      </VStack>

                      {/* Action Button */}
                      <Button 
                        size="sm" 
                        colorScheme="teal" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductSelect?.(product);
                        }}
                      >
                        View Details
                      </Button>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ProductsPanel;