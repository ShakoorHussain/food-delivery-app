import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/customer/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token is invalid or expired, redirect to login
        console.error('Authentication failed - invalid token');
        localStorage.removeItem('token');
        logout();
        navigate('/login');
        return;
      }

      if (response.status === 500) {
        // Server error - don't logout, just show error
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        setError('Server error. Please try again later.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Remove old item
      await fetch('https://food-delivery-backend-fiuj.onrender.com/api/customer/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId: itemId }),
      });

      // Add with new quantity
      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId: itemId, quantity: newQuantity }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/customer/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId: itemId }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        logout();
        navigate('/login');
        return;
      }

      if (response.ok) {
        await fetchCart();
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item. Please try again.');
    }
  };

const placeOrder = async () => {
    setProcessingPayment(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // Place order
      const orderResponse = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/orders/place', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (orderResponse.status === 401) {
        localStorage.removeItem('token');
        logout();
        navigate('/login');
        return;
      }

      if (!orderResponse.ok) {
        throw new Error('Failed to place order');
      }

      const orderData = await orderResponse.json();

      // Calculate ETA (assume 5km distance, adjust as needed)
      const distanceKm = 5; // You can make this dynamic based on restaurant location
      try {
        await fetch('https://food-delivery-backend-fiuj.onrender.com/api/eta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            orderId: orderData.order._id,
            distanceKm: distanceKm
          }),
        });
      } catch (etaError) {
        console.log('ETA calculation failed, continuing with order:', etaError);
      }

      // Simulate payment
      const paymentResponse = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: orderData.order._id }),
      });

      if (paymentResponse.status === 401) {
        localStorage.removeItem('token');
        logout();
        navigate('/login');
        return;
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.order.paymentStatus === 'paid') {
        alert('Order placed successfully! 🎉');
        navigate('/order-history');
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/restaurants')}
            className="flex items-center text-white hover:text-blue-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Restaurants
          </button>
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-500 text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <button
              onClick={() => navigate('/restaurants')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">
                    Cart Items ({cart.items.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div key={item._id} className="p-6 flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-12 h-12 text-white opacity-50" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">
                          {item.menuItem?.name || 'Unknown Item'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {item.menuItem?.description || 'No description available'}
                        </p>
                        <p className="text-blue-600 font-semibold">
                          ${item.menuItem?.price?.toFixed(2) || '0.00'} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.menuItem._id, item.quantity - 1)
                          }
                          className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-lg min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.menuItem._id, item.quantity + 1)
                          }
                          className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold text-gray-800">
                          ${((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.menuItem._id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${cart.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${((cart.totalPrice || 0) * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total</span>
                      <span>
                        ${((cart.totalPrice || 0) + 2.99 + (cart.totalPrice || 0) * 0.1).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={processingPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing your order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;