import React from 'react';
import { Flex, Text, Button, HStack, Box } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContex';

interface TopBarProps {
  showLogoutButton?: boolean;
  username?: string;
}

const TopBar: React.FC<TopBarProps> = ({ 
  showLogoutButton = true,
  username 
}) => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  
  // Get username from props, localStorage, or default
  const displayUsername = username || user?.username || localStorage.getItem("username") || "User";
  
  // Format location for display
  const formatLocation = (location?: string) => {
    if (!location) return null;
    try {
      const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null); // Clear user context
    navigate("/Logout");
  };

  return (
    <Flex 
      bg="teal.600" 
      color="white" 
      align="center" 
      justify={showLogoutButton ? "space-between" : "flex-start"}
      direction="row"
      height="60px" 
      px={6} 
      boxShadow="md"
      flexWrap="nowrap"
    >
      <HStack spacing={3}>
        <Box>
          <Text fontWeight="bold" fontSize="lg">
            {displayUsername}
          </Text>
          {formatLocation(user?.location) && (
            <Text fontSize="xs" opacity={0.8}>
              📍 {formatLocation(user?.location)}
            </Text>
          )}
        </Box>
      </HStack>
      
      {showLogoutButton && (
        <Button 
          bg="white" 
          color="teal.600" 
          variant="solid" 
          size="sm"
          height="40px"
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
      )}
    </Flex>
  );
};

export default TopBar;