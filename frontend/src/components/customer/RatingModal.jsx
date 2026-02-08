import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

const RatingModal = ({ order, onClose, onSubmit }) => {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRestaurant, setHoveredRestaurant] = useState(0);
  const [hoveredDelivery, setHoveredDelivery] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (restaurantRating === 0) {
      alert('Please rate the restaurant');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/ratings/${order._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          restaurantRating,
          deliveryRating: deliveryRating || undefined,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (response.ok) {
        alert('Thank you for your rating! ⭐');
        onSubmit();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating, hovered, setHovered, label }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                star <= (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {rating > 0 ? `${rating} out of 5 stars` : 'Click to rate'}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Rate Your Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-500">
            Help us improve by rating your experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Restaurant Rating */}
          <StarRating
            rating={restaurantRating}
            setRating={setRestaurantRating}
            hovered={hoveredRestaurant}
            setHovered={setHoveredRestaurant}
            label="How was the food quality? *"
          />

          {/* Delivery Rating */}
          {order.deliveryAgent && (
            <StarRating
              rating={deliveryRating}
              setRating={setDeliveryRating}
              hovered={hoveredDelivery}
              setHovered={setHoveredDelivery}
              label="How was the delivery service?"
            />
          )}

          {/* Feedback */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows="4"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || restaurantRating === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          * Restaurant rating is required
        </p>
      </div>
    </div>
  );
};

export default RatingModal;