import React from 'react';
import { Flex, Text, Button } from '@chakra-ui/react';
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
  const { setUser } = useUser();
  
  // Get username from props, localStorage, or default
  const displayUsername = username || localStorage.getItem("username") || "User";

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
      <Text fontWeight="bold" fontSize="lg">
        {displayUsername}
      </Text>
      
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