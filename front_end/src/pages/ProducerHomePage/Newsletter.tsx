import React, { useState, useEffect } from "react";
import { 
  Heading, Button, Flex, Text, Box, useToast, useDisclosure, VStack, 
  Card, CardBody, CardHeader, Badge, AlertDialog, AlertDialogOverlay,
  AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContex";
import { productService, type Product } from "../../services/productService";
import { eventService, type Event } from "../../services/eventService";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  subscribed_date: string;
}

const Newsletter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const username = localStorage.getItem("username") || "User";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Mock subscribers data - in a real app, this would come from an API
  useEffect(() => {
    const mockSubscribers: Subscriber[] = [
      { id: "1", email: "john.doe@example.com", name: "John Doe", subscribed_date: "2025-01-15" },
      { id: "2", email: "jane.smith@example.com", name: "Jane Smith", subscribed_date: "2025-02-10" },
      { id: "3", email: "farmer.bob@example.com", name: "Bob Wilson", subscribed_date: "2025-03-05" },
    ];
    setSubscribers(mockSubscribers);
  }, []);

  const fetchUserProducts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const userProducts = await productService.getUserProducts(user.id);
      setProducts(userProducts);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    if (!user?.id) return;

    try {
      // Get user's event vendor relationships
      const userEventVendors = await eventService.getEventVendorsByConsumerId(user.id);
      
      // Fetch all events and filter for user's events
      const allEvents = await eventService.getAllEvents();
      const userEvents = allEvents.filter(event => 
        userEventVendors.some(vendor => vendor.event_id === event.event_id)
      );
      
      setEvents(userEvents);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserProducts();
      fetchUserEvents();
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  const handleSendNewsletter = async () => {
    setSendingEmail(true);
    
    try {
      // Simulate email sending - in a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Newsletter Sent!",
        description: `Newsletter sent to ${subscribers.length} subscribers`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate back to home page
      navigate("/");
    } catch (err: any) {
      console.error("Error sending newsletter:", err);
      toast({
        title: "Send Failed",
        description: "Failed to send newsletter. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSendingEmail(false);
      onClose();
    }
  };

  return (
    <>
      <Flex height="100vh" direction="column">
        {/* Top Bar */}
        <Flex bg="teal.600" color="white" align="center" justify="space-between" height="60px" px={6} boxShadow="md">
          <Text fontWeight="bold" fontSize="lg">{username}</Text>
          <Button 
            bg="white" 
            color="teal.600" 
            variant="solid" 
            onClick={handleLogout}
            _hover={{
              bg: "gray.100",
              transform: "translateY(-1px)",
              boxShadow: "md"
            }}
            _active={{
              bg: "gray.200",
              transform: "translateY(0)"
            }}
          >
            Logout
          </Button>
        </Flex>
        
        <Flex flex="1" direction="row">
          {/* Sidebar */}
          <ProducerSupplyBar activePage="newsletter" />
          
          {/* Main Content */}
          <Flex flex="1" direction="column" p={6} overflowY="auto">
            <Heading color="teal.600" size="lg" mb={6}>Send Newsletter</Heading>
            
            <VStack spacing={6} align="stretch">
              {/* Subscribers Section */}
              <Card>
                <CardHeader>
                  <Heading size="md" color="teal.600">
                    Your Subscribers ({subscribers.length})
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    {subscribers.map((subscriber) => (
                      <Flex key={subscriber.id} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md">
                        <Box>
                          <Text fontWeight="bold">{subscriber.name}</Text>
                          <Text fontSize="sm" color="gray.600">{subscriber.email}</Text>
                        </Box>
                        <Badge colorScheme="green">Subscribed {subscriber.subscribed_date}</Badge>
                      </Flex>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <Heading size="md" color="teal.600">
                    Your Products ({products.length})
                  </Heading>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <Text>Loading products...</Text>
                  ) : products.length === 0 ? (
                    <Text color="gray.500">No products available</Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {products.map((product) => (
                        <Flex key={product.id} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md">
                          <Box>
                            <Text fontWeight="bold">{product.product_name}</Text>
                            <Text fontSize="sm" color="gray.600">{product.description}</Text>
                          </Box>
                          <Badge colorScheme="teal">Product</Badge>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>

              {/* Events Section */}
              <Card>
                <CardHeader>
                  <Heading size="md" color="teal.600">
                    Your Events ({events.length})
                  </Heading>
                </CardHeader>
                <CardBody>
                  {events.length === 0 ? (
                    <Text color="gray.500">No events available</Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {events.map((event) => (
                        <Flex key={event.event_id} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md">
                          <Box>
                            <Text fontWeight="bold">{event.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              📅 {event.date} • 🕐 {event.time} • 📍 {event.location}
                            </Text>
                          </Box>
                          <Badge colorScheme="blue">Event</Badge>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>

              {/* Send Button */}
              <Flex justify="center" pt={4}>
                <Button 
                  colorScheme="green" 
                  size="lg" 
                  onClick={onOpen}
                  isDisabled={subscribers.length === 0}
                >
                  Send Newsletter
                </Button>
              </Flex>
            </VStack>
          </Flex>
        </Flex>
      </Flex>

      {/* Confirmation Modal */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="green.600">
              Send Newsletter
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to send this newsletter to {subscribers.length} subscribers?
              This will include your current products and events.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleSendNewsletter} 
                ml={3}
                isLoading={sendingEmail}
                loadingText="Sending..."
              >
                Yes, Send Newsletter
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default Newsletter;