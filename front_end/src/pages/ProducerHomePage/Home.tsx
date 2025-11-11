
import React, { useState, useEffect } from "react";
import { 
  Heading, 
  Button, 
  Flex, 
  Text, 
  Box, 
  useToast, 
  useDisclosure
} from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import ProductEntryForm from "./HomePageAssets/ProductEntryForm";
import ProductModifyForm from "./HomePageAssets/ProductModifyForm";
import UserProductsTable from "../../components/UserProductsTable";
import ProducerEventsList from "../../components/ProducerEventsList";
import FarmerReviews from "../../components/FarmerReviews";
import ProducerInfoCard from "../../components/ProducerInfoCard";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContex";
import { productService, type Product } from "../../services/productService";
import apiClient from "../../services/apli-client";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isModifyOpen, onOpen: onModifyOpen, onClose: onModifyClose } = useDisclosure();
  const username = localStorage.getItem("username") || "User";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);

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

  // Fetch ratings for the producer to calculate average
  const fetchProducerRatings = async () => {
    if (!user?.id) return;
    
    try {
      const response = await apiClient.get(`/v1/ratings/?producer_id=${user.id}`);
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
    // Fetch products and ratings when component mounts or user changes
    if (user?.id) {
      fetchUserProducts();
      fetchProducerRatings();
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

  // Function to handle product modification
  const handleProductModify = (product: Product) => {
    setSelectedProduct(product);
    onModifyOpen();
  };

  // Function to refresh products after modification
  const handleProductModified = () => {
    refreshProducts();
    setSelectedProduct(null);
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
          {/* Producer Information Card */}
          {user && (
            <ProducerInfoCard 
              producer={{
                id: user.id,
                username: user.username || username,
                email: user.email || "No email provided",
                role: user.role || "producer",
                phone_number: user.phone_number
              }}
              averageRating={averageRating}
              totalReviews={totalReviews}
              productsCount={products.length}
              showDescription={true}
              mb={6}
            />
          )}

          {/* Upcoming Events Section */}
          {user?.id && (
            <Box mb={6}>
              <ProducerEventsList 
                producerId={user.id} 
                maxEvents={3}
                showHeading={true}
                compact={true}
              />
            </Box>
          )}

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
          <Box flex="1" overflowY="auto" mb={6}>
            <UserProductsTable 
              products={products} 
              loading={loading} 
              error={error}
              onProductDeleted={refreshProducts}
              onProductModify={handleProductModify}
              userId={user?.id || ""}
            />
          </Box>

          {/* My Reviews Section */}
          {user?.id && user?.username && (
            <Box>
              <FarmerReviews 
                producer={{ id: user.id, username: user.username }} 
                showReviewButton={false}
                title="My Reviews"
              />
            </Box>
          )}
        </Flex>
      </Flex>
      <ProductEntryForm isOpen={isOpen} onClose={onClose} onProductAdded={refreshProducts} />
      <ProductModifyForm 
        isOpen={isModifyOpen} 
        onClose={onModifyClose} 
        onProductModified={handleProductModified}
        product={selectedProduct}
      />
    </Flex>
  );
};

export default Home;
