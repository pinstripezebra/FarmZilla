import "./LoginSignup.css";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Avatar,
  Heading,
  Stack,
  Button,
  Text,
  Link
} from "@chakra-ui/react";
import backgroundImage from "../../assets/logout2.jpg";

const Logout = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      backgroundImage={`url(${backgroundImage})`} // Set the background image
      backgroundSize="cover" // Ensure the image covers the entire container
      backgroundPosition="center" // Center the image
    >
      <Stack
        flexDir="column"
        backgroundColor="rgba(255, 255, 255, 0.9)"
        mb="2"
        justifyContent="center"
        alignItems="center"
        borderRadius="md"
      >
        <Box minW={{ base: "90%", md: "468px" }}>
          <form>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="whiteAlpha.900"
              boxShadow="md"
              alignItems="center" // Ensure all components in the Stack are centered
              borderRadius="md"
            >
              <Avatar bg="teal.500" />
              <Heading color="teal.400">Goodbye</Heading>
              <Text fontSize="lg" textAlign="center">
                You have successfully logged out. Thank you for using FarmZilla!
              </Text>

              {/* Return to Login Button */}
              <Button
                borderRadius={0}
                type="submit"
                variant="solid"
                colorScheme="teal"
                width="full"
                onClick={() => {
                  // Clear local storage items
                  localStorage.removeItem("token");
                  localStorage.removeItem("username");
                  navigate("/Login"); // Navigate to the login page
                }}
              >
                Back to Login
              </Button>
              <Box>
                <Link color="teal.500" onClick={() => navigate("/LandingPage")}>
                  Back to Landing
                </Link>
              </Box>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Logout;