import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShoppingCart, LogOut, MapPin, Clock, Package } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import MapView from '../shared/MapView';
const RestaurantList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxDeliveryTime, setMaxDeliveryTime] = useState('');
  const [error, setError] = useState('');
const [showMap, setShowMap] = useState(false);
  const cuisineTypes = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'American', 'Thai'];
  const deliveryTimes = ['20', '30', '40', '60'];

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCuisine, minRating]);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      let url = 'https://food-delivery-backend-fiuj.onrender.com/api/restaurants?';
      if (selectedCuisine) url += `cuisine=${selectedCuisine}&`;
      if (minRating) url += `minRating=${minRating}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      
      // Add estimated delivery time to each restaurant (20-40 mins)
      const restaurantsWithETA = data.map(restaurant => ({
        ...restaurant,
        estimatedDeliveryTime: Math.floor(Math.random() * (40 - 20 + 1)) + 20
      }));
      
      setRestaurants(restaurantsWithETA);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeliveryTime = maxDeliveryTime ? restaurant.estimatedDeliveryTime <= parseInt(maxDeliveryTime) : true;
    return matchesSearch && matchesDeliveryTime;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-white mr-2" />
              <h1 className="text-2xl font-bold text-white">FoodExpress</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/order-history')}
                className="relative p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                title="Order History"
              >
                <Package className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                title="Cart"
              >
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>
              
              <div className="text-white">
                <p className="text-sm font-semibold">Welcome, {user?.name}</p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all"
              >
                <LogOut className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Discover Restaurants</h2>
          <p className="text-gray-600">Find your favorite food from the best restaurants</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Restaurant
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cuisine Type
              </label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
              >
                <option value="">All Cuisines</option>
                {cuisineTypes.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Time
              </label>
              <select
                value={maxDeliveryTime}
                onChange={(e) => setMaxDeliveryTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
              >
                <option value="">Any Time</option>
                {deliveryTimes.map((time) => (
                  <option key={time} value={time}>
                    Under {time} mins
                  </option>
                ))}
              </select>
            </div>
            <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    View Mode
  </label>
  <button
    onClick={() => setShowMap(!showMap)}
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-600 focus:border-blue-600 focus:outline-none transition-all font-semibold text-gray-700"
  >
    {showMap ? '📋 List View' : '🗺️ Map View'}
  </button>
</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading restaurants...</p>
          </div>
        )}

        {/* Restaurant Grid */}
      {/* Map/Grid Toggle */}
{!loading && showMap && filteredRestaurants.length > 0 && (
  <div>
    <h3 className="text-xl font-bold text-gray-800 mb-4">Restaurant Locations</h3>
    <MapView
      center={[31.5204, 74.3587]} // Lahore center
      zoom={12}
      height="500px"
      markers={filteredRestaurants.map(restaurant => ({
        lat: restaurant.location?.lat || 31.5204,
        lng: restaurant.location?.lng || 74.3587,
        name: restaurant.name,
        address: restaurant.address,
        type: 'restaurant',
        info: `⭐ ${restaurant.rating} | ⏱️ ${restaurant.estimatedDeliveryTime} mins`
      }))}
    />
  </div>
)}

{/* Restaurant Grid */}
{!loading && !showMap && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredRestaurants.length > 0 ? (
      filteredRestaurants.map((restaurant) => (
        <div
          key={restaurant._id}
          onClick={() => navigate(`/restaurant/${restaurant._id}`)}
          className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
        >
          {/* Restaurant card content stays the same */}
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-20 h-20 text-white opacity-50" />
          </div>

          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {restaurant.name}
            </h3>

            <div className="flex items-center mb-3">
              <MapPin className="w-4 h-4 text-gray-400 mr-1" />
              <p className="text-sm text-gray-600">{restaurant.address}</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-semibold text-gray-800">
                  {restaurant.rating || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">
                  {restaurant.estimatedDeliveryTime} mins
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {restaurant.cuisine?.slice(0, 3).map((cuisine, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full"
                >
                  {cuisine}
                </span>
              ))}
            </div>

            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all">
              View Menu
            </button>
          </div>
        </div>
      ))
    ) : (
      <div className="col-span-full text-center py-12">
        <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No restaurants found
        </h3>
        <p className="text-gray-500">Try adjusting your filters</p>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default RestaurantList;