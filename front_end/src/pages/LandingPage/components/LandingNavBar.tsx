import { 
  Box, 
  HStack, 
  Button, 
  IconButton,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  VStack,
  useDisclosure,
  useBreakpointValue,
  Image
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import FarmZillaLogo from "../../../assets/FarmZilla.png";

const scrollToSection = (id: string) => {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
};

const LandingNavbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const logoHeight = useBreakpointValue({ base: '32px', md: '40px' });
  const padding = useBreakpointValue({ base: 4, md: 6, lg: 12 });

  const navItems = [
    { name: "Introduction", id: "introduction" },
    { name: "Features", id: "features" },
    { name: "About Us", id: "aboutus" },
    { name: "Gallery", id: "gallery" },
    { name: "Contact Us", id: "contactus" }
  ];

  const handleNavClick = (id: string) => {
    scrollToSection(id);
    onClose(); // Close mobile menu
  };

  if (isDesktop) {
    // Desktop Navigation
    return (
      <Box
        as="nav"
        width="100%"
        bg="teal.500"
        px={padding}
        py={3}
        boxShadow="md"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <HStack spacing={8} justify="space-between" align="center" width="100%">
          <Image src={FarmZillaLogo} alt="FarmZilla Logo" height={logoHeight} />
          <HStack spacing={4}>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                color="white"
                _hover={{ bg: "teal.600" }}
                onClick={() => scrollToSection(item.id)}
                fontSize={{ base: 'sm', lg: 'md' }}
              >
                {item.name}
              </Button>
            ))}
          </HStack>
        </HStack>
      </Box>
    );
  }

  // Mobile Navigation
  return (
    <>
      <Box
        as="nav"
        width="100%"
        bg="teal.500"
        px={padding}
        py={3}
        boxShadow="md"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <HStack justify="space-between" align="center" width="100%">
          <Image src={FarmZillaLogo} alt="FarmZilla Logo" height={logoHeight} />
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
            color="white"
            _hover={{ bg: "teal.600" }}
            size="lg"
          />
        </HStack>
      </Box>
      
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg="teal.500">
          <DrawerCloseButton color="white" size="lg" />
          <DrawerBody>
            <VStack spacing={4} mt={12} align="stretch">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "teal.600" }}
                  onClick={() => handleNavClick(item.id)}
                  fontSize="lg"
                  justifyContent="flex-start"
                  height="auto"
                  py={3}
                >
                  {item.name}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default LandingNavbar;