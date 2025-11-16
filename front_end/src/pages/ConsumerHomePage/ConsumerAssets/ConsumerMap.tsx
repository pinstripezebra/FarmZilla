import React, { useState, useEffect } from 'react';
import { 
  Box, Input, InputGroup, InputLeftElement, 
  VStack, Heading
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import EventsMapDisplay from '../../../components/EventsMapDisplay';
import ProductsPanel from './ProductsPanel';
import { eventService, type Event, type EventVendor } from '../../../services/eventService';
import { useUser } from '../../../context/UserContex';

interface ConsumerMapProps {
  height?: string;
  width?: string;
}

const ConsumerMap: React.FC<ConsumerMapProps> = ({ 
  height = "600px", 
  width = "100%" 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEventVendors] = useState<EventVendor[]>([]); // Consumer won't have event vendors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { user } = useUser();
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all upcoming events for consumer view
      const eventsData = await eventService.getAllEvents();
      
      // Filter for future events only
      const now = new Date();
      const upcomingEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      });

      setEvents(upcomingEvents);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events that might have products matching the search query
  // This is a simplified version - in a real app, you'd want to
  // fetch which products are available at each event
  const filteredEvents = events.filter(event => 
    !searchQuery || 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSelect = (product: any) => {
    // Handle product selection - could open a modal, navigate to details, etc.
    console.log('Product selected:', product);
  };

  return (
    <Box height={height} width={width}>
      <VStack spacing={4} align="stretch" height="100%">
        {/* Search Bar */}
        <Box>
          <Heading size="lg" color="teal.600" mb={4}>
            Discover Local Products & Events
          </Heading>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search for products, events, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
              borderColor="gray.300"
              _focus={{
                borderColor: "teal.500",
                boxShadow: "0 0 0 1px teal.500"
              }}
            />
          </InputGroup>
        </Box>

        {/* Main Content - Flexible Layout */}
        <Box display="flex" gap={4} flex="1" height="0">
          {/* Left side - Events Map (flexible width) */}
          <Box 
            flex="1"
            height="100%" 
            border="1px solid" 
            borderColor="gray.200" 
            borderRadius="md" 
            overflow="hidden"
            boxShadow="sm"
            minWidth="300px"
          >
            {loading ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                Loading map...
              </Box>
            ) : error ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="red.500">
                {error}
              </Box>
            ) : (
              <EventsMapDisplay 
                events={filteredEvents} 
                userEventVendors={userEventVendors}
                userLocation={user?.location}
                defaultZoom={0.01}
                height="100%" 
              />
            )}
          </Box>

          {/* Right side - Collapsible Products Panel */}
          <ProductsPanel 
            searchQuery={searchQuery}
            onProductSelect={handleProductSelect}
            height="100%"
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default ConsumerMap;