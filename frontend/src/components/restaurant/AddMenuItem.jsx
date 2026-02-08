import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, FileText, Tag, Upload, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const AddMenuItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  });
  const [error, setError] = useState('');

  const categories = [
    'Appetizers',
    'Main Course',
    'Pizza',
    'Burgers',
    'Pasta',
    'Rice',
    'Noodles',
    'Tacos',
    'Burritos',
    'Breads',
    'Sides',
    'Desserts',
    'Beverages',
    'Other',
  ];

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  const fetchRestaurantProfile = async () => {
    try {
      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/restaurants', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const restaurants = await response.json();
        const myRestaurant = restaurants.find((r) => r.user === user._id);
        if (myRestaurant) {
          setRestaurantId(myRestaurant._id);
        } else {
          setError('Restaurant profile not found. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
      setError('Failed to load restaurant profile');
    }
  };

  // Compress and resize image
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (quality 0.7 = 70%)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB for original)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      try {
        setError('');
        setLoading(true);
        
        // Compress image
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        setImageFile(file);
      } catch (error) {
        console.error('Error compressing image:', error);
        setError('Failed to process image');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.category || !formData.price) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      setLoading(false);
      return;
    }

    if (!restaurantId) {
      setError('Restaurant profile not found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          restaurantId: restaurantId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          image: imagePreview || '', // Send compressed base64 image
        }),
      });

      if (response.ok) {
        alert('Menu item added successfully! 🎉');
        navigate('/restaurant-dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add menu item');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      setError('Failed to add menu item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/restaurant-dashboard')}
            className="flex items-center text-white hover:text-blue-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Add New Menu Item</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline-block mr-2" />
                Item Image (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={loading}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-semibold mb-1">
                      {loading ? 'Compressing image...' : 'Click to upload image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB (will be compressed)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Compressed & Ready
                  </div>
                </div>
              )}
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                <Package className="w-4 h-4 inline-block mr-2" />
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Margherita Pizza"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline-block mr-2" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your delicious item..."
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Category and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline-block mr-2" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline-block mr-2" />
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-semibold">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/restaurant-dashboard')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Menu Item'}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            * Required fields | Images are automatically compressed for optimal performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddMenuItem;