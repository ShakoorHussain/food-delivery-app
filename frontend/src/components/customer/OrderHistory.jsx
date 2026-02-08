import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, ShoppingCart, Star } from 'lucide-react';
import { useAuth } from '../auth/Authcontext';
import { useSocket } from '../auth/SocketContext';
import RatingModal from './RatingModal';

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !connected) {
      console.log('❌ Socket not connected');
      return;
    }

    console.log('🔴 Setting up socket listeners for order updates');

    // Listen for order status updates (specific order room)
    const handleOrderStatusUpdate = (data) => {
      console.log('📦 Order status updated (room):', data);
      
      // Update the specific order in state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id.toString() === data.orderId.toString()
            ? { ...order, status: data.status }
            : order
        )
      );

      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('Order Update', {
          body: `Your order status: ${data.status}`,
          icon: '/logo.png'
        });
      }
    };

    // Listen for general order updates (broadcast)
    const handleOrderUpdate = (data) => {
      console.log('📬 Order update (broadcast):', data);
      
      if (user && data.customerId === user._id.toString()) {
        console.log('✅ This update is for me!');
        
        // Update the specific order in state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id.toString() === data.orderId.toString()
              ? { ...order, status: data.status }
              : order
          )
        );

        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Order Update', {
            body: `Your order is now: ${data.status}`,
            icon: '/logo.png'
          });
        }
      }
    };

    socket.on('orderStatusUpdated', handleOrderStatusUpdate);
    socket.on('orderUpdate', handleOrderUpdate);

    // Cleanup listeners
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('orderStatusUpdated', handleOrderStatusUpdate);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, connected, user]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchOrderHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/orders/customer/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedOrders = data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);

        // Join socket rooms for each order
        if (socket && connected) {
          sortedOrders.forEach(order => {
            socket.emit('joinOrder', order._id);
            console.log('🔗 Joined order room:', order._id);
          });
        }
      } else {
        setError('Failed to load order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const openRatingModal = (order) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedOrderForRating(null);
  };

  const handleRatingSubmit = () => {
    fetchOrderHistory();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-purple-100 text-purple-800 border-purple-200',
      'out-for-delivery': 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      accepted: <CheckCircle className="w-5 h-5" />,
      preparing: <Package className="w-5 h-5" />,
      'out-for-delivery': <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  const getPaymentStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    } else if (status === 'failed') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'delivered') return order.status === 'delivered';
    if (filter === 'pending') return order.status !== 'delivered';
    return true;
  });

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Order History</h1>
              <p className="text-blue-100">Track all your past orders</p>
              {connected && (
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-blue-100">Live updates enabled</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Welcome back,</p>
              <p className="text-lg font-semibold">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                filter === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Active ({orders.filter(o => o.status !== 'delivered').length})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                filter === 'delivered'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Completed ({orders.filter(o => o.status === 'delivered').length})
            </button>
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
            <p className="text-gray-600">Loading order history...</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "Start ordering delicious food from your favorite restaurants!" 
                : `You don't have any ${filter} orders at the moment.`}
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Browse Restaurants
            </button>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(order.status)} border-2`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">Order Items:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-gray-800 font-medium">
                                {item.menuItem?.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-800 font-semibold">
                            ${(item.menuItem?.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getPaymentStatusBadge(order.paymentStatus)}
                      {order.estimatedDeliveryTime && order.status !== 'delivered' && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            ETA: {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${order.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Rating Section */}
                  {order.status === 'delivered' && !order.rating?.ratedAt && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <button
                        onClick={() => openRatingModal(order)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center"
                      >
                        <Star className="w-5 h-5 mr-2" />
                        Rate This Order
                      </button>
                    </div>
                  )}

                  {order.status === 'delivered' && order.rating?.ratedAt && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Your Rating:</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="font-bold text-gray-800">{order.rating.restaurantRating}/5</span>
                          </div>
                        </div>
                        {order.rating.feedback && (
                          <p className="text-sm text-gray-600 mt-2">{order.rating.feedback}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Timeline (for active orders) */}
                {order.status !== 'delivered' && (
                  <div className="bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300"></div>
                      
                      {['pending', 'accepted', 'preparing', 'out-for-delivery', 'delivered'].map((status, idx) => {
                        const statuses = ['pending', 'accepted', 'preparing', 'out-for-delivery', 'delivered'];
                        const currentIndex = statuses.indexOf(order.status);
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                          <div key={status} className="flex flex-col items-center z-10">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              } ${isCurrent ? 'ring-4 ring-blue-200 animate-pulse' : ''}`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-2 text-center max-w-[60px]">
                              {status.replace('-', ' ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedOrderForRating && (
        <RatingModal
          order={selectedOrderForRating}
          onClose={closeRatingModal}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default OrderHistory;