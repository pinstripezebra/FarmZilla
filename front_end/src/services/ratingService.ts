import api from './apli-client';

export interface Rating {
  rating_id: string;
  producer_id: string;
  consumer_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface ProducerRating {
  producer_id: string;
  average_rating: number;
  total_reviews: number;
  username?: string;
}

export const ratingService = {
  // Get all ratings for a specific producer
  getProducerRatings: async (producerId: string): Promise<Rating[]> => {
    try {
      const response = await api.get(`/v1/ratings/?producer_id=${producerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching producer ratings:', error);
      throw error;
    }
  },

  // Get all ratings by a specific consumer
  getConsumerRatings: async (consumerId: string): Promise<Rating[]> => {
    try {
      const response = await api.get(`/v1/ratings/?consumer_id=${consumerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consumer ratings:', error);
      throw error;
    }
  },

  // Get all ratings
  getAllRatings: async (): Promise<Rating[]> => {
    try {
      const response = await api.get('/v1/ratings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all ratings:', error);
      throw error;
    }
  },

  // Create a new rating
  createRating: async (ratingData: {
    producer_id: string;
    consumer_id: string;
    rating: number;
    review?: string;
  }): Promise<Rating> => {
    try {
      const response = await api.post('/v1/ratings/', ratingData);
      return response.data;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  },

  // Calculate producer ratings from raw ratings data
  calculateProducerRating: (ratings: Rating[]): { average_rating: number; total_reviews: number } => {
    if (!ratings || ratings.length === 0) {
      return { average_rating: 0, total_reviews: 0 };
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = totalRating / ratings.length;
    
    return {
      average_rating: Math.round(average * 10) / 10, // Round to 1 decimal place
      total_reviews: ratings.length
    };
  },

  // Get producer ratings summary (average and count) for multiple producers
  getProducersRatingSummary: async (producerIds: string[]): Promise<Map<string, ProducerRating>> => {
    try {
      const ratingsMap = new Map<string, ProducerRating>();
      
      // Fetch ratings for each producer
      await Promise.all(
        producerIds.map(async (producerId) => {
          try {
            const ratings = await ratingService.getProducerRatings(producerId);
            const { average_rating, total_reviews } = ratingService.calculateProducerRating(ratings);
            
            ratingsMap.set(producerId, {
              producer_id: producerId,
              average_rating,
              total_reviews
            });
          } catch (error) {
            // If ratings fail for one producer, set default values
            ratingsMap.set(producerId, {
              producer_id: producerId,
              average_rating: 0,
              total_reviews: 0
            });
          }
        })
      );

      return ratingsMap;
    } catch (error) {
      console.error('Error fetching producers rating summary:', error);
      throw error;
    }
  }
};

export default ratingService;