import React, { useState, useEffect } from "react";
import { 
  Heading, 
  Button, 
  Flex, 
  Text, 
  Box, 
  useToast,
  VStack,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton
} from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContex";
import { matchService, type ProducerConsumerMatch } from "../../services/matchService";

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();
  const username = localStorage.getItem("username") || "User";
  
  const [matches, setMatches] = useState<ProducerConsumerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchCustomers = async () => {
    if (!user?.id) {
      setError("User ID not available. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const customerMatches = await matchService.getMatchesForProducer(user.id);
      setMatches(customerMatches);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch customers";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch customers when component mounts or user changes
    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  const handleBack = () => {
    navigate("/");
  };

  // Function to refresh customers (can be called from sidebar)
  const refreshCustomers = () => {
    fetchCustomers();
  };

  const renderCustomersList = () => {
    if (loading) {
      return (
        <VStack spacing={4} align="stretch">
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </VStack>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading customers!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      );
    }

    if (matches.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No customers found</AlertTitle>
            <AlertDescription>
              You don't have any customers yet. Customers will appear here when they connect with your products.
            </AlertDescription>
          </Box>
        </Alert>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        {matches.map((match) => (
          <Card key={match.id} variant="outline">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="lg" color="teal.600">
                  Customer ID: {match.consumer_id}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Match ID: {match.id}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  };

  return (
    <Flex height="100vh" direction="column">
      {/* Top Bar */}
      <Flex bg="teal.600" color="white" align="center" height="60px" px={6} boxShadow="md">
        <Text fontWeight="bold" fontSize="lg">{username}</Text>
      </Flex>
      
      <Flex flex="1" direction="row">
        {/* Sidebar */}
        <ProducerSupplyBar onProductAdded={refreshCustomers} showAddProducts={false} />
        
        {/* Main Content */}
        <Flex flex="1" direction="column" p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Flex align="center" gap={4}>
              <Button variant="outline" colorScheme="teal" onClick={handleBack}>
                ← Back to Products
              </Button>
              <Heading color="teal.600" size="lg">My Customers</Heading>
            </Flex>
            <Button colorScheme="teal" onClick={handleLogout}>
              Logout
            </Button>
          </Flex>
          
          {/* Customers List */}
          <Box flex="1" overflowY="auto">
            {renderCustomersList()}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Customers;