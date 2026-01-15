import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Link,
  useBreakpointValue,
  useDisclosure,
  VStack,
  Image,
  Text
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../assets/FarmZilla.png';

const ResponsiveNavigation: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const logoSize = useBreakpointValue({ base: '40px', md: '50px', lg: '60px' });

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/ConsumerHomePage' },
    { name: 'Events', path: '/UpcomingEvents' },
    { name: 'Login', path: '/Login' }
  ];

  const Logo = () => (
    <HStack alignItems="center" spacing={3}>
      <Image src={logo} boxSize={logoSize} borderRadius={10} />
      <Text 
        fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }} 
        fontWeight="bold" 
        color="teal.700"
        display={{ base: 'none', sm: 'block' }}
      >
        Farmzilla
      </Text>
    </HStack>
  );

  if (isDesktop) {
    // Desktop Navigation
    return (
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        p={{ base: 4, md: 6 }}
        bg="white"
        shadow="sm"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Logo />
        </Link>
        <HStack spacing={{ base: 4, md: 6, lg: 8 }}>
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              as={RouterLink} 
              to={item.path}
              fontSize={{ base: 'md', lg: 'lg' }}
              fontWeight="medium"
              color="gray.700"
              _hover={{ color: 'teal.600', textDecoration: 'none' }}
              transition="color 0.2s"
            >
              {item.name}
            </Link>
          ))}
        </HStack>
      </Flex>
    );
  }

  // Mobile Navigation
  return (
    <>
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        p={4}
        bg="white"
        shadow="sm"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Logo />
        </Link>
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon />}
          onClick={onOpen}
          variant="ghost"
          colorScheme="teal"
          size="lg"
        />
      </Flex>
      
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton size="lg" />
          <DrawerBody>
            <VStack spacing={6} mt={12} align="stretch">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  as={RouterLink} 
                  to={item.path}
                  onClick={onClose}
                  fontSize="lg"
                  fontWeight="medium"
                  color="gray.700"
                  _hover={{ color: 'teal.600', textDecoration: 'none', bg: 'gray.50' }}
                  p={3}
                  borderRadius="md"
                  transition="all 0.2s"
                >
                  {item.name}
                </Link>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ResponsiveNavigation;