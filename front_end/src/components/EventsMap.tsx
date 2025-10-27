import React, { useState, useEffect } from 'react';
import { Box, VStack, Card, CardBody, Heading, Text, Grid, GridItem, Spinner, Alert, AlertIcon, Button, HStack, useToast } from '@chakra-ui/react';
import { eventService, type Event, type EventVendor } from '../services/eventService';
import { useUser } from '../context/UserContex';

interface EventsMapProps {
  height?: string;
  width?: string;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  height = "400px", 
  width = "100%" 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [userEventVendors, setUserEventVendors] = useState<EventVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [signupLoading, setSignupLoading] = useState<string>("");
  
  const { user } = useUser();
  const toast = useToast();

  useEffect(() => {
    const fetchEventsAndUserData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all events
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);

        // If user is logged in, fetch their event vendor relationships
        if (user?.id) {
          const userEventVendorsData = await eventService.getEventVendorsByConsumerId(user.id);
          setUserEventVendors(userEventVendorsData);

          // Filter events that the user is attending
          const userEventsData = eventsData.filter(event => 
            userEventVendorsData.some(vendor => vendor.event_id === event.event_id)
          );
          setUserEvents(userEventsData);
        }
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndUserData();
  }, [user?.id]);

  // OpenStreetMap iframe URL for Seattle area
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik&marker=47.6062%2C-122.3321";

  const handleSignupForEvent = async (eventId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sign up for events",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if user is already signed up
    const isAlreadySignedUp = userEventVendors.some(vendor => vendor.event_id === eventId);
    if (isAlreadySignedUp) {
      toast({
        title: "Already Signed Up",
        description: "You are already signed up for this event",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSignupLoading(eventId);
      await eventService.createEventVendor(eventId, user.id);
      
      // Refresh the data
      const updatedUserEventVendors = await eventService.getEventVendorsByConsumerId(user.id);
      setUserEventVendors(updatedUserEventVendors);
      
      const updatedUserEvents = events.filter(event => 
        updatedUserEventVendors.some(vendor => vendor.event_id === event.event_id)
      );
      setUserEvents(updatedUserEvents);

      toast({
        title: "Successfully Signed Up!",
        description: "You've been added to the event",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error signing up for event:', err);
      toast({
        title: "Signup Failed",
        description: "Failed to sign up for event. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSignupLoading("");
    }
  };

  const isUserSignedUp = (eventId: string) => {
    return userEventVendors.some(vendor => vendor.event_id === eventId);
  };

  const renderEventsContent = () => {
    if (loading) {
      return (
        <VStack spacing={4} align="center" justify="center" height="100%">
          <Spinner size="lg" color="teal.500" />
          <Text>Loading events...</Text>
        </VStack>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      );
    }

    if (events.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No events found
        </Alert>
      );
    }

    // Get events that the user is NOT signed up for
    const upcomingEvents = events.filter(event => !isUserSignedUp(event.event_id));

    return (
      <VStack spacing={6} align="stretch" height="100%" overflowY="auto">
        {/* Your Events Section */}
        <Box>
          <Heading size="md" color="teal.600" textAlign="center" mb={4}>
            Your Events
          </Heading>
          
          {userEvents.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              You haven't signed up for any events yet
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {userEvents.map((event) => (
                <Card key={`user-${event.event_id}`} variant="outline" size="sm" bg="teal.50" borderColor="teal.200">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Heading size="sm" color="teal.600">
                        {event.name}
                      </Heading>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        📅 {event.date}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        🕐 {event.time}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        📍 {event.location}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Coordinates: {event.coordinates}
                      </Text>
                      <Text fontSize="sm">
                        {event.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </Box>

        {/* Upcoming Events Section */}
        <Box>
          <Heading size="md" color="teal.600" textAlign="center" mb={4}>
            Upcoming Events
          </Heading>
          
          {upcomingEvents.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              No upcoming events available
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {upcomingEvents.map((event) => (
                <Card key={`upcoming-${event.event_id}`} variant="outline" size="sm">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" width="100%">
                        <Heading size="sm" color="teal.600">
                          {event.name}
                        </Heading>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="solid"
                          isLoading={signupLoading === event.event_id}
                          loadingText="Signing up..."
                          onClick={() => handleSignupForEvent(event.event_id)}
                          disabled={!user}
                        >
                          Signup
                        </Button>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        📅 {event.date}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        🕐 {event.time}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        📍 {event.location}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Coordinates: {event.coordinates}
                      </Text>
                      <Text fontSize="sm">
                        {event.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    );
  };

  return (
    <Box height={height} width={width} borderRadius="md" overflow="hidden" boxShadow="md">
      <Grid templateColumns="1fr 1fr" height="100%">
        {/* Map Section */}
        <GridItem>
          <Box height="100%" position="relative">
            <iframe
              src={mapUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px 0 0 8px'
              }}
              title="Events Map"
            />
            <Box
              position="absolute"
              top={2}
              left={2}
              bg="white"
              px={2}
              py={1}
              borderRadius="md"
              boxShadow="sm"
              fontSize="xs"
              fontWeight="bold"
              color="teal.600"
            >
              📍 Event Locations
            </Box>
          </Box>
        </GridItem>

        {/* Events List Section */}
        <GridItem bg="gray.50" p={4}>
          {renderEventsContent()}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default EventsMap;