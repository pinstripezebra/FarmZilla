import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useBreakpointValue,
  Container,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import ResponsiveNavigation from '../components/ResponsiveNavigation';
import ResponsiveCard from '../components/ResponsiveCard';

const ResponsiveTestPage: React.FC = () => {
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl', lg: '3xl' });
  const textSize = useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' });
  const gridCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  const sampleProducts = [
    { id: '1', name: 'Fresh Tomatoes', price: 3.50, farmer: 'John Doe', description: 'Organic cherry tomatoes' },
    { id: '2', name: 'Sweet Corn', price: 2.25, farmer: 'Jane Smith', description: 'Sweet yellow corn' },
    { id: '3', name: 'Organic Carrots', price: 4.00, farmer: 'Bob Wilson', description: 'Fresh organic carrots' },
    { id: '4', name: 'Green Beans', price: 3.75, farmer: 'Alice Brown', description: 'Crisp green beans' },
    { id: '5', name: 'Bell Peppers', price: 5.00, farmer: 'Mike Davis', description: 'Colorful bell peppers' },
    { id: '6', name: 'Lettuce', price: 2.50, farmer: 'Sarah Johnson', description: 'Fresh lettuce heads' },
  ];

  return (
    <>
      <ResponsiveNavigation />
      <ResponsiveLayout>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box textAlign="center" py={8}>
            <Heading size={headingSize} color="teal.600" mb={4}>
              FarmZilla Responsive Design Test
            </Heading>
            <Text fontSize={textSize} color="gray.600" maxW="600px" mx="auto">
              This page demonstrates the responsive components working together across different screen sizes.
              Resize your browser or use device emulation to test the responsive behavior.
            </Text>
          </Box>

          <Divider />

          {/* Breakpoint Indicator */}
          <Box textAlign="center" p={4} bg="blue.50" borderRadius="md">
            <Text fontWeight="bold" color="blue.600">
              Current Breakpoint: {useBreakpointValue({ base: 'Mobile', md: 'Tablet', lg: 'Desktop', xl: 'Large Desktop' })}
            </Text>
          </Box>

          {/* Responsive Layout Demo */}
          <Box>
            <Heading size="lg" mb={4} color="teal.600">
              Responsive Layout Demo
            </Heading>
            <Text mb={4}>
              The container automatically adjusts padding and max-width based on screen size.
            </Text>
            <Box bg="teal.50" p={4} borderRadius="md" border="2px dashed" borderColor="teal.200">
              <Text textAlign="center" fontWeight="bold">
                This content is inside the ResponsiveLayout component
              </Text>
            </Box>
          </Box>

          {/* Responsive Card Grid */}
          <Box>
            <Heading size="lg" mb={4} color="teal.600">
              Responsive Card Grid
            </Heading>
            <Text mb={6}>
              Cards automatically adjust their layout: 1 column on mobile, 2 on tablet, 3 on desktop.
            </Text>
            <Grid templateColumns={`repeat(${gridCols}, 1fr)`} gap={6}>
              {sampleProducts.map((product) => (
                <GridItem key={product.id}>
                  <ResponsiveCard>
                    <VStack spacing={3} align="stretch">
                      <Box
                        height="150px"
                        bg="gray.200"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="gray.500" fontWeight="bold">
                          Product Image
                        </Text>
                      </Box>
                      <Heading size="md" color="teal.600">
                        {product.name}
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        By {product.farmer}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        {product.description}
                      </Text>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="bold" fontSize="lg" color="teal.600">
                          ${product.price.toFixed(2)}
                        </Text>
                        <Button 
                          colorScheme="teal" 
                          size={buttonSize}
                          onClick={() => console.log(`Clicked ${product.name}`)}
                        >
                          Add to Cart
                        </Button>
                      </HStack>
                    </VStack>
                  </ResponsiveCard>
                </GridItem>
              ))}
            </Grid>
          </Box>

          {/* Responsive Text Demo */}
          <Box>
            <Heading size="lg" mb={4} color="teal.600">
              Responsive Typography
            </Heading>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize={useBreakpointValue({ base: 'xs', md: 'sm', lg: 'md' })} color="gray.500" mb={2}>
                  Small Text - Responsive
                </Text>
                <Text fontSize={useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' })}>
                  Regular Text - This text size adapts to screen size for optimal readability.
                </Text>
              </Box>
              <Box>
                <Text fontSize={useBreakpointValue({ base: 'md', md: 'lg', lg: 'xl' })} fontWeight="bold">
                  Large Text - Responsive headings for different devices
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Responsive Button Group */}
          <Box>
            <Heading size="lg" mb={4} color="teal.600">
              Responsive Buttons
            </Heading>
            <VStack spacing={4}>
              <HStack 
                spacing={4} 
                flexWrap="wrap" 
                justifyContent={useBreakpointValue({ base: 'center', md: 'flex-start' })}
              >
                <Button colorScheme="teal" size={buttonSize}>
                  Primary Action
                </Button>
                <Button variant="outline" colorScheme="teal" size={buttonSize}>
                  Secondary Action
                </Button>
                <Button variant="ghost" colorScheme="teal" size={buttonSize}>
                  Tertiary Action
                </Button>
              </HStack>
              <Button 
                colorScheme="orange" 
                size={buttonSize}
                width={useBreakpointValue({ base: 'full', md: 'auto' })}
              >
                Full Width on Mobile
              </Button>
            </VStack>
          </Box>

          {/* Responsive Spacing Demo */}
          <Box>
            <Heading size="lg" mb={4} color="teal.600">
              Responsive Spacing
            </Heading>
            <VStack spacing={useBreakpointValue({ base: 4, md: 6, lg: 8 })}>
              <Box bg="green.100" p={useBreakpointValue({ base: 4, md: 6, lg: 8 })} borderRadius="md" width="full">
                <Text textAlign="center" fontWeight="bold">
                  Box with responsive padding
                </Text>
              </Box>
              <Box bg="blue.100" p={useBreakpointValue({ base: 2, md: 4, lg: 6 })} borderRadius="md" width="full">
                <Text textAlign="center" fontWeight="bold">
                  Another box with different responsive padding
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Mobile-specific features */}
          <Box display={useBreakpointValue({ base: 'block', md: 'none' })}>
            <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
              <Heading size="md" color="red.600" mb={2}>
                Mobile-Only Content
              </Heading>
              <Text color="red.700">
                This section is only visible on mobile devices. Use this pattern for mobile-specific features.
              </Text>
            </Box>
          </Box>

          {/* Desktop-specific features */}
          <Box display={useBreakpointValue({ base: 'none', lg: 'block' })}>
            <Box bg="purple.50" p={6} borderRadius="md" border="1px solid" borderColor="purple.200">
              <Heading size="md" color="purple.600" mb={2}>
                Desktop-Only Content
              </Heading>
              <Text color="purple.700">
                This section is only visible on desktop screens. Perfect for complex features that need more space.
              </Text>
            </Box>
          </Box>

          {/* Footer */}
          <Box textAlign="center" py={8} mt={8} borderTop="1px solid" borderColor="gray.200">
            <Text color="gray.500">
              FarmZilla Responsive Design System Test - Resize your browser to see the magic! ✨
            </Text>
          </Box>
        </VStack>
      </ResponsiveLayout>
    </>
  );
};

export default ResponsiveTestPage;