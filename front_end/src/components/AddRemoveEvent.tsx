import React, { useState } from 'react';
import { 
  Box, VStack, Card, CardBody, Heading, Text, Spinner, Alert, AlertIcon, 
  Button, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure 
} from '@chakra-ui/react';
import { eventService, type Event, type EventVendor } from '../services/eventService';
import { useUser } from '../context/UserContex';
import ProducerEventsList from './ProducerEventsList';
import CreateEvent from './CreateEvent';

interface AddRemoveEventProps {
  events: Event[];
  userEventVendors: EventVendor[];
  loading: boolean;
  error: string;
  onDataRefresh: () => void;
}

const AddRemoveEvent: React.FC<AddRemoveEventProps> = ({ 
  events, 
  userEventVendors, 
  loading, 
  error, 
  onDataRefresh 
}) => {
  const [signupLoading, setSignupLoading] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState<string>("");
  const [eventToWithdraw, setEventToWithdraw] = useState<string>("");
  const [createEventOpen, setCreateEventOpen] = useState(false);
  
  const { user } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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
      onDataRefresh();

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
      onDataRefresh();

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
        {user?.id && (
          <ProducerEventsList 
            producerId={user.id} 
            showHeading={true}
            compact={false}
            showWithdraw={true}
            onWithdraw={handleWithdrawFromEvent}
            withdrawLoading={withdrawLoading}
          />
        )}

        {/* Upcoming Events Section */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="md" color="teal.600">
              Upcoming Events
            </Heading>
            {user && (
              <Button
                size="md"
                colorScheme="teal"
                variant="solid"
                onClick={() => setCreateEventOpen(true)}
              >
                Create Event
              </Button>
            )}
          </HStack>
          
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
      <Box bg="gray.50" p={4} height="100%">
        {renderEventsContent()}
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

      {/* Create Event Modal */}
      <CreateEvent
        isOpen={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onEventCreated={() => {
          // Refresh events data when a new event is created
          onDataRefresh();
        }}
        userId={user?.id}
      />
    </>
  );
};

export default AddRemoveEvent;