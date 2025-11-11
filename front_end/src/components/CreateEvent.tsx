import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  useToast,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Box,
  Text,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { eventService, type Event } from '../services/eventService';

interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  userId?: string;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

const CreateEvent: React.FC<CreateEventProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  userId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    coordinates: ''
  });
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const toast = useToast();

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingLocation(true);
    try {
      // Using Nominatim API (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: 'Location Search Failed',
        description: 'Unable to search for locations. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleLocationQueryChange = (value: string) => {
    setLocationQuery(value);
    setFormData({ ...formData, location: value });
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchLocations(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    const coordinates = `${suggestion.lat},${suggestion.lon}`;
    setFormData({
      ...formData,
      location: suggestion.display_name,
      coordinates: coordinates
    });
    setLocationQuery(suggestion.display_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      time: '',
      location: '',
      description: '',
      coordinates: ''
    });
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Event name is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: 'Validation Error',
        description: 'Event date is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.time) {
      toast({
        title: 'Validation Error',
        description: 'Event time is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Event location is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.coordinates) {
      toast({
        title: 'Validation Error',
        description: 'Please select a location from the search results.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCreating(true);

    try {
      // Generate a unique event ID
      const eventId = `E${Date.now()}`;

      // Create the event
      const newEvent: Event = {
        event_id: eventId,
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time,
        location: formData.location.trim(),
        description: formData.description.trim() || `Join us for ${formData.name.trim()}!`,
        coordinates: formData.coordinates
      };

      await eventService.createEvent(newEvent);

      // Sign up the creator for the event (if userId is provided)
      if (userId) {
        await eventService.createEventVendor(eventId, userId);
      }

      toast({
        title: 'Event Created Successfully!',
        description: 'Your event has been created and you have been signed up.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      resetForm();
      onClose();
      onEventCreated?.();

    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'Failed to Create Event',
        description: error.response?.data?.detail || 'An error occurred while creating the event.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!creating}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Event</ModalHeader>
        <ModalCloseButton isDisabled={creating} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Event Name */}
            <FormControl isRequired>
              <FormLabel>Event Name</FormLabel>
              <Input
                placeholder="Enter event name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                isDisabled={creating}
              />
            </FormControl>

            {/* Date and Time */}
            <HStack spacing={4}>
              <FormControl isRequired flex="1">
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  isDisabled={creating}
                />
              </FormControl>
              
              <FormControl isRequired flex="1">
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  isDisabled={creating}
                />
              </FormControl>
            </HStack>

            {/* Location Search */}
            <FormControl isRequired position="relative">
              <FormLabel>Location</FormLabel>
              <InputGroup>
                <Input
                  placeholder="Search for location (e.g., 123 Main St, Portland, OR)"
                  value={locationQuery}
                  onChange={(e) => handleLocationQueryChange(e.target.value)}
                  isDisabled={creating}
                />
                <InputRightElement>
                  {searchingLocation ? (
                    <Spinner size="sm" />
                  ) : (
                    <SearchIcon color="gray.400" />
                  )}
                </InputRightElement>
              </InputGroup>
              
              {/* Location Suggestions */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  zIndex={10}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  shadow="lg"
                  maxHeight="200px"
                  overflowY="auto"
                >
                  <List>
                    {locationSuggestions.map((suggestion, index) => (
                      <ListItem
                        key={suggestion.place_id || index}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        onClick={() => selectLocation(suggestion)}
                      >
                        <Text fontSize="sm" noOfLines={2}>
                          {suggestion.display_name}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </FormControl>

            {/* Coordinates Display */}
            {formData.coordinates && (
              <FormControl>
                <FormLabel fontSize="sm" color="gray.600">
                  Coordinates (Auto-filled)
                </FormLabel>
                <Input
                  value={formData.coordinates}
                  isReadOnly
                  bg="gray.50"
                  fontSize="sm"
                />
              </FormControl>
            )}

            {/* Description */}
            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                placeholder="Event description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                isDisabled={creating}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={creating}
          >
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={creating}
            loadingText="Creating Event..."
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateEvent;