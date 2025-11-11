import { useState } from "react";
import "./LoginSignup.css";
import { MdOutlineEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import {
  HStack,
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
  ButtonGroup,
  Link,
  Image,
  Text,
  Switch,
  FormLabel,
} from "@chakra-ui/react";
import { FaUserAlt, FaLock, FaPhone } from "react-icons/fa";
import backgroundImage from "../../assets/register.jpg";
import logo from "../../assets/FarmZilla.png";
import { createUser } from "./CreateUser";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("consumer"); // Default to consumer
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Location-related state
  const [allowLocation, setAllowLocation] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleShowClick = () => setShowPassword(!showPassword);
  const handleShowConfirmClick = () =>
    setShowConfirmPassword(!showConfirmPassword);

  // Password validation function checks for one letter, one number, one special character, min 6 chars
  const isValidPassword = (pw: string) => {
    return /[A-Za-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  };

  // Function to get user's current location
  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude},${longitude}`;
          resolve(locationString);
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Handle location switch toggle
  const handleLocationToggle = async (checked: boolean) => {
    setAllowLocation(checked);
    
    if (checked) {
      setLocationLoading(true);
      try {
        const userLocation = await getCurrentLocation();
        setLocation(userLocation);
        toast({
          title: "Location captured successfully",
          description: "Your location will be included when creating your account",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: "Location access failed",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setAllowLocation(false); // Reset switch if location fails
      } finally {
        setLocationLoading(false);
      }
    } else {
      setLocation(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords must match",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!isValidPassword(password)) {
      toast({
        title: "Password requirements not met",
        description:
          "Password must contain at least one letter, one number, and one special character.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Check if location is required and provided
    if (!allowLocation || !location) {
      toast({
        title: "Location data required",
        description: "Please enable location sharing to create your account. This helps us connect you with nearby users.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // Create user data object with location
      const userData = {
        email,
        username,
        password,
        role: role, // Use selected role
        location: location, // Include location data
        phone_number: role === "producer" ? phoneNumber : null // Include phone number for producers only
      };
      
      await createUser(userData);
      toast({
        title: "Account created successfully!",
        description: "Navigating to login page...",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/Login");
      }, 1000);
    } catch (err: any) {
      // Check for username conflict
      if (
        err.response &&
        (err.response.status === 409 || 
          (err.response.data &&
            typeof err.response.data.detail === "string" &&
            err.response.data.detail.toLowerCase().includes("username")))
      ) {
        toast({
          title: "Username already exists",
          description: "Please choose a different username.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      // check for other errors
      } else {
        toast({
          title: "Registration failed",
          description: "An error occurred while creating your account.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
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
      backgroundImage={`url(${backgroundImage})`}
      backgroundSize="cover"
      backgroundPosition="center"
    >
      {/* Header Section */}
      <Box position="absolute" top="0" left="0" padding="10px">
        <HStack alignItems="center">
          {/* Logo */}
          <Image src={logo} boxSize="60px" borderRadius={10} />
          {/* App Title */}
          <Text fontSize="2xl" fontWeight="bold" color="teal.700">
            FarmZilla
          </Text>
        </HStack>
      </Box>
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Box minW={{ base: "90%", md: "468px" }}>
          <form onSubmit={handleSubmit}>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="whiteAlpha.900"
              boxShadow="md"
              alignItems="center"
              borderRadius="md"
            >
              <Avatar bg="teal.500" />
              <Heading color="teal.400">Create Account</Heading>

              {/* email*/}
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<MdOutlineEmail color="gray.300" />}
                  />
                  <Input
                    type="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              {/* username*/}
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<FaUserAlt color="gray.300" />}
                  />
                  <Input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              {/* password */}
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    color="gray.300"
                    children={<FaLock color="gray.300" />}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* confirm password */}
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    color="gray.300"
                    children={<FaLock color="gray.300" />}
                  />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={handleShowConfirmClick}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Role Selection */}
              <FormControl>
                <Text mb={2} fontSize="sm" color="gray.600" textAlign="center">
                  Select your role:
                </Text>
                <ButtonGroup size="md" isAttached variant="outline" width="full">
                  <Button
                    colorScheme={role === "consumer" ? "teal" : "gray"}
                    variant={role === "consumer" ? "solid" : "outline"}
                    onClick={() => setRole("consumer")}
                    width="50%"
                  >
                    Consumer
                  </Button>
                  <Button
                    colorScheme={role === "producer" ? "teal" : "gray"}
                    variant={role === "producer" ? "solid" : "outline"}
                    onClick={() => setRole("producer")}
                    width="50%"
                  >
                    Producer
                  </Button>
                </ButtonGroup>
              </FormControl>

              {/* Phone Number Field - Only for Producers */}
              {role === "producer" && (
                <FormControl>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      children={<FaPhone color="gray.300" />}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </InputGroup>
                </FormControl>
              )}

              {/* Location Data Switch */}
              <FormControl>
                <Flex justifyContent="space-between" alignItems="center" width="full">
                  <Box>
                    <FormLabel htmlFor="location-switch" mb="0" fontSize="sm">
                      Allow location data <Text as="span" color="red.500">*</Text>
                    </FormLabel>
                    <Text fontSize="xs" color="gray.500">
                      Required: Help us connect you with nearby {role === "producer" ? "consumers" : "producers"}
                    </Text>
                  </Box>
                  <Switch
                    id="location-switch"
                    colorScheme="teal"
                    isChecked={allowLocation}
                    onChange={(e) => handleLocationToggle(e.target.checked)}
                    isDisabled={locationLoading}
                  />
                </Flex>
                {location && (
                  <Text fontSize="xs" color="green.500" mt={1} textAlign="center">
                    ✓ Location captured successfully
                  </Text>
                )}
                {locationLoading && (
                  <Text fontSize="xs" color="blue.500" mt={1} textAlign="center">
                    📍 Getting your location...
                  </Text>
                )}
              </FormControl>

              {/* Signup Button */}
              <Button
                borderRadius={0}
                type="submit"
                variant="solid"
                colorScheme="teal"
                width="full"
              >
                Signup
              </Button>

              {/* Back Button */}
              <Stack alignItems="center">
                <Box>
                  Already have account?{" "}
                  <Link color="teal.500" onClick={() => navigate("/Login")}>
                    Back to Login
                  </Link>
                </Box>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Signup;