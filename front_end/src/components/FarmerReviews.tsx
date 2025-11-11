import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  Text,
  Flex,
  Button,
  useToast,
  Heading,
  Icon,
  VStack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import apiClient from "../services/apli-client";

interface Producer {
  id: string;
  username: string;
}

interface FarmerReviewsProps {
  producer: Producer;
  showReviewButton?: boolean; // For consumer view vs producer view
  title?: string; // Custom title for the reviews section
}

const FarmerReviews: React.FC<FarmerReviewsProps> = ({ 
  producer, 
  showReviewButton = true,
  title = "Customer Reviews"
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch ratings for the producer to calculate average
  const fetchProducerRatings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/v1/ratings/?producer_id=${producer.id}`);
      const ratings = response.data;
      
      if (ratings && ratings.length > 0) {
        setTotalReviews(ratings.length);

        // Fetch usernames for each review
        const reviewsWithUsernames = await Promise.all(
          ratings.map(async (rating: any) => {
            try {
              const userResponse = await apiClient.get(`/v1/user/${rating.consumer_id}/username`);
              return {
                ...rating,
                username: userResponse.data.username
              };
            } catch (error) {
              console.error(`Failed to fetch username for consumer ${rating.consumer_id}:`, error);
              return {
                ...rating,
                username: "Unknown User"
              };
            }
          })
        );
        
        // Sort reviews by date (newest first)
        reviewsWithUsernames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setReviews(reviewsWithUsernames);
      } else {
        setTotalReviews(0);
        setReviews([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch producer ratings:", err);
      setTotalReviews(0);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducerRatings();
  }, [producer.id]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingReview(true);

    try {
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a review.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const reviewData = {
        producer_id: producer.id,
        consumer_id: currentUserId,
        rating: rating,
        review: review.trim() || null,
      };

      await apiClient.post("/v1/ratings/", reviewData);

      toast({
        title: "Review Submitted!",
        description: `Thank you for reviewing ${producer.username}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh ratings to update average
      fetchProducerRatings();

      // Reset form and close modal
      setRating(0);
      setReview("");
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to submit review";
      toast({
        title: "Review Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleModalClose = () => {
    setRating(0);
    setReview("");
    onClose();
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            as={StarIcon}
            boxSize={4}
            color={star <= rating ? "yellow.400" : "gray.300"}
          />
        ))}
      </HStack>
    );
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Heading size="md" mb={4} color="teal.600">
          {title} (...)
        </Heading>
        <Text>Loading reviews...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Reviews Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="teal.600">
          {title} ({totalReviews})
        </Heading>
        {showReviewButton && (
          <Button
            colorScheme="teal"
            size="sm"
            onClick={onOpen}
            leftIcon={<StarIcon />}
          >
            Write Review
          </Button>
        )}
      </Flex>

      {/* Reviews Display */}
      {reviews.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No reviews yet</AlertTitle>
            <AlertDescription>
              {showReviewButton 
                ? `Be the first to review ${producer.username}! Click the "Write Review" button to share your experience.`
                : "You don't have any reviews yet. Keep providing great service to encourage customer feedback!"
              }
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <VStack spacing={4} align="stretch">
          {reviews.map((review) => (
            <Card key={review.id} borderRadius="md" shadow="sm">
              <CardBody>
                <Flex justify="space-between" align="start" mb={3}>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      {renderStars(review.rating)}
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {review.rating}/5
                      </Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" color="teal.600">
                        {review.username}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        •
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {formatDate(review.date)}
                      </Text>
                    </HStack>
                  </VStack>
                </Flex>
                
                {review.review && (
                  <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                    {review.review}
                  </Text>
                )}
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Review Modal - Only show if showReviewButton is true */}
      {showReviewButton && (
        <Modal isOpen={isOpen} onClose={handleModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Review {producer.username}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Star Rating */}
                <FormControl>
                  <FormLabel>Rating *</FormLabel>
                  <HStack spacing={2}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        as={StarIcon}
                        boxSize={6}
                        color={star <= rating ? "yellow.400" : "gray.300"}
                        cursor="pointer"
                        onClick={() => setRating(star)}
                        _hover={{ color: "yellow.400" }}
                      />
                    ))}
                  </HStack>
                  {rating > 0 && (
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {rating} out of 5 stars
                    </Text>
                  )}
                </FormControl>

                {/* Review Text */}
                <FormControl>
                  <FormLabel>Review (Optional)</FormLabel>
                  <Textarea
                    placeholder="Share your experience with this farmer..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    resize="vertical"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="teal"
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
                loadingText="Submitting..."
              >
                Submit Review
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default FarmerReviews;