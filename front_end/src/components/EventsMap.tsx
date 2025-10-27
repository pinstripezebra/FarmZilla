import React, { useState, useEffect } from 'react';
import { 
  Box, VStack, Card, CardBody, Heading, Text, Grid, GridItem, Spinner, Alert, AlertIcon, 
  Button, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure 
} from '@chakra-ui/react';
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
  const [withdrawLoading, setWithdrawLoading] = useState<string>("");
  const [eventToWithdraw, setEventToWithdraw] = useState<string>("");
  const [mapUrl, setMapUrl] = useState<string>("");
  
  const { user } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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

  // Generate dynamic map URL with event markers using Leaflet
  const generateMapUrl = () => {
    if (events.length === 0) {
      // Default Seattle area if no events
      return "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik";
    }

    // Parse coordinates and create markers data
    const coordinates = events.map(event => {
      const [lat, lng] = event.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng, event };
    }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

    if (coordinates.length === 0) {
      // Fallback if no valid coordinates
      return "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik";
    }

    // Calculate bounding box
    const lats = coordinates.map(coord => coord.lat);
    const lngs = coordinates.map(coord => coord.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounds (minimum padding for single point)
    const latPadding = Math.max((maxLat - minLat) * 0.2, 0.01);
    const lngPadding = Math.max((maxLng - minLng) * 0.2, 0.01);

    // Create markers data
    const markersData = coordinates.map(coord => {
      const isUserEvent = userEventVendors.some(vendor => vendor.event_id === coord.event.event_id);
      return {
        lat: coord.lat,
        lng: coord.lng,
        name: coord.event.name,
        date: coord.event.date,
        time: coord.event.time,
        location: coord.event.location,
        isUserEvent
      };
    });

    // Generate Leaflet map HTML
    const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-popup { font-family: Arial, sans-serif; }
        .user-event { color: #38a169; font-weight: bold; }
        .available-event { color: #3182ce; font-weight: bold; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').fitBounds([
            [${minLat - latPadding}, ${minLng - lngPadding}],
            [${maxLat + latPadding}, ${maxLng + lngPadding}]
        ]);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        var markers = ${JSON.stringify(markersData)};
        
        markers.forEach(function(marker) {
            var icon = L.divIcon({
                html: '<div style="background-color: ' + (marker.isUserEvent ? '#38a169' : '#3182ce') + '; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-size: 16px;">📍</div>',
                className: 'custom-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            var popupContent = '<div class="custom-popup">' +
                '<div class="' + (marker.isUserEvent ? 'user-event' : 'available-event') + '">' + marker.name + '</div>' +
                '<div>📅 ' + marker.date + '</div>' +
                '<div>🕐 ' + marker.time + '</div>' +
                '<div>📍 ' + marker.location + '</div>' +
                '<div style="margin-top: 5px; font-size: 12px; color: #666;">' + 
                (marker.isUserEvent ? 'You are attending this event' : 'Available to join') + '</div>' +
                '</div>';
            
            var mapMarker = L.marker([marker.lat, marker.lng], {icon: icon})
                .addTo(map)
                .bindPopup(popupContent);
            
            // Show popup on hover instead of click
            mapMarker.on('mouseover', function() {
                this.openPopup();
            });
            
            mapMarker.on('mouseout', function() {
                this.closePopup();
            });
        });
    </script>
</body>
</html>`;

    // Convert to data URI
    const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(mapHtml);
    return dataUri;
  };

  // Update map URL when events change
  useEffect(() => {
    const newMapUrl = generateMapUrl();
    setMapUrl(newMapUrl);
  }, [events, userEventVendors]);

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

  const handleWithdrawFromEvent = (eventId: string) => {
    setEventToWithdraw(eventId);
    onOpen();
  };

  const confirmWithdraw = async () => {
    if (!user?.id || !eventToWithdraw) return;

    try {
      setWithdrawLoading(eventToWithdraw);
      await eventService.deleteEventVendor(eventToWithdraw, user.id);
      
      // Refresh the data
      const updatedUserEventVendors = await eventService.getEventVendorsByConsumerId(user.id);
      setUserEventVendors(updatedUserEventVendors);
      
      const updatedUserEvents = events.filter(event => 
        updatedUserEventVendors.some(vendor => vendor.event_id === event.event_id)
      );
      setUserEvents(updatedUserEvents);

      toast({
        title: "Successfully Withdrawn",
        description: "You've been removed from the event",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setEventToWithdraw("");
    } catch (err: any) {
      console.error('Error withdrawing from event:', err);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw from event. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setWithdrawLoading("");
    }
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
                      <HStack justify="space-between" width="100%">
                        <Heading size="sm" color="teal.600">
                          {event.name}
                        </Heading>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="solid"
                          isLoading={withdrawLoading === event.event_id}
                          loadingText="Withdrawing..."
                          onClick={() => handleWithdrawFromEvent(event.event_id)}
                        >
                          Withdraw
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
    <>
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
                📍 Event Locations ({events.length})
              </Box>
            </Box>
          </GridItem>

          {/* Events List Section */}
          <GridItem bg="gray.50" p={4}>
            {renderEventsContent()}
          </GridItem>
        </Grid>
      </Box>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove from Event
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove yourself from this event? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmWithdraw} 
                ml={3}
                isLoading={withdrawLoading === eventToWithdraw}
                loadingText="Removing..."
              >
                Yes, Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default EventsMap;