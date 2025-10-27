
import React, { useState, useEffect } from "react";
import { Heading, Button, Flex, Text, Box, useToast, useDisclosure } from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import ProductEntryForm from "./HomePageAssets/ProductEntryForm";
import UserProductsTable from "../../components/UserProductsTable";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContex";
import { productService, type Product } from "../../services/productService";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const username = localStorage.getItem("username") || "User";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchUserProducts = async () => {
    if (!user?.id) {
      setError("User ID not available. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const userProducts = await productService.getUserProducts(user.id);
      setProducts(userProducts);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch products";
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
    // Fetch products when component mounts or user changes
    if (user?.id) {
      fetchUserProducts();
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  // Function to refresh products (can be called from ProductEntryForm)
  const refreshProducts = () => {
    fetchUserProducts();
  };

  return (
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
        <ProducerSupplyBar activePage="products" />
        {/* Main Content */}
        <Flex flex="1" direction="column" p={6}>
          <Flex justify="flex-start" align="center" mb={4}>
            <Heading color="teal.600" size="lg">My Products</Heading>
          </Flex>
          
          {/* Add Products Button */}
          <Flex justify="flex-start" mb={4}>
            <Button colorScheme="teal" variant="solid" onClick={onOpen}>
              Add Products
            </Button>
          </Flex>
          
          {/* Products Table */}
          <Box flex="1" overflowY="auto">
            <UserProductsTable 
              products={products} 
              loading={loading} 
              error={error}
              onProductDeleted={refreshProducts}
              userId={user?.id || ""}
            />
          </Box>
        </Flex>
      </Flex>
      <ProductEntryForm isOpen={isOpen} onClose={onClose} onProductAdded={refreshProducts} />
    </Flex>
  );
};

export default Home;
