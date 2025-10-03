import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  Box,
  Flex,
  Avatar,
  Heading,
  Stack,
  FormControl,
  InputGroup,
  InputLeftElement,
  Input,
  InputRightElement,
  Button,
  FormHelperText,
  Link,
  HStack,
  Text,
  Image,
} from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";
import api from "./../../services/apli-client";
import backgroundImage from "../../assets/login_background.jpg";
import logo from "../../assets/FarmZilla.png";

// setting user context when they login
import { useUser } from "../../context/UserContex";

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: number;
}

export interface UserGame {
  id: string;
  username: string;
  asin: string;
}

function Login() {
  // State for username, password, and error message
  const [localUsername, setLocalUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for loading spinner
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUsername } = useUser();
  const handleShowClick = () => setShowPassword(!showPassword);

  // validation form to ensure username and password are not blank
  const validateForm = () => {
    if (!localUsername.trim() || !password.trim()) {
      setError("Username and password cannot be blank.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const formDetails = new URLSearchParams();
    formDetails.append("username", localUsername);
    formDetails.append("password", password);

    try {
      const response = await api.post("/v1/token", formDetails, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      setLoading(false);

      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", localUsername);
        setUsername(localUsername);
        navigate("/");
        console.log("Login successful:", data.access_token);
      }
    } catch (error: any) {
      setLoading(false);
      if (error.response && error.response.data) {
        setError(
          error.response.data.detail ||
            "Authentication Failed. Please try again."
        );
      } else {
        setError(
          "An error occurred while trying to log in. Please try again later."
        );
      }
    }
  };

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
      {/* Header Section */}
      <Box position="absolute" top="0" left="0" padding="10px">
        <HStack alignItems="center">
          {/* Logo */}
          <Image src={logo} boxSize="60px" borderRadius={10} />

          {/* App Title */}
          <Text fontSize="2xl" fontWeight="bold" color="teal.700">
            Optigame
          </Text>
        </HStack>
      </Box>

      <Stack
        spacing={4}
        p="1rem"
        backgroundColor="rgba(255, 255, 255, 0.9)" // Semi-transparent white background
        boxShadow="md"
        borderRadius="md"
        width="400px"
      >
        {/* Avatar and Heading */}
        <Stack alignItems="center">
          <Avatar bg="teal.500" />
          <Heading color="teal.600">Welcome</Heading>
        </Stack>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <FormControl mb={4}>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                children={<FaUserAlt color="gray.300" />}
              />
              <Input
                type="text"
                placeholder="username"
                value={localUsername} // Bind input value to username state
                onChange={(e) => setLocalUsername(e.target.value)} // Update username state on input change
              />
            </InputGroup>
          </FormControl>

          {/* Password */}
          <FormControl mb={4}>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                color="gray.300"
                children={<FaLock color="gray.300" />}
              />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password} // Bind input value to password state
                onChange={(e) => setPassword(e.target.value)} // Update password state on input change
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormHelperText textAlign="right">
              <Link>forgot password?</Link>
            </FormHelperText>
          </FormControl>

          {/* Login Button */}
          <Button
            borderRadius={0}
            type="submit"
            variant="solid"
            colorScheme="teal"
            width="full"
          >
            Login
          </Button>
        </form>
        {/* Sign-Up Link */}
        <Stack alignItems="center">
          <Box>
            New to us?{" "}
            <Link color="teal.500" onClick={() => navigate("/Signup")}>
              Sign Up
            </Link>
          </Box>
          <Box>
            <Link color="teal.500" onClick={() => navigate("/LandingPage")}>
              Back to Landing
            </Link>
          </Box>
        </Stack>
      </Stack>
    </Flex>
  );
}

export default Login;