import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, PlusCircle, Edit, Trash2, Truck, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../auth/SocketContext';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      if (activeTab === 'menu') {
        fetchMenuItems();
      } else {
        fetchOrders();
        fetchDeliveryAgents();
      }
    }
  }, [activeTab, restaurantId]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !connected || !restaurantId) return;

    console.log('🍽️ Setting up restaurant socket listeners');

    // Listen for new orders
    socket.on('newOrder', (data) => {
      if (data.restaurantId === restaurantId) {
        console.log('📦 New order received:', data);
        fetchOrders();
        
        if (Notification.permission === 'granted') {
          new Notification('New Order Received!', {
            body: `Order #${data.orderId.slice(-6)} - $${data.totalPrice}`,
            icon: '/logo.png'
          });
        }
      }
    });

    // Listen for order status updates
    socket.on('orderStatusUpdated', (data) => {
      console.log('📦 Order status updated:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === data.orderId 
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderStatusUpdated');
    };
  }, [socket, connected, restaurantId]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchRestaurantProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/restaurants', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const restaurants = await response.json();
        const myRestaurant = restaurants.find(r => r.user === user._id);
        if (myRestaurant) {
          setRestaurantId(myRestaurant._id);
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/menu/restaurant/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/restaurant', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);

        // Join socket rooms for each order
        if (socket && connected) {
          data.forEach(order => {
            socket.emit('joinOrder', order._id);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/delivery/agents', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryAgents(data);
      }
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('Order status updated!');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedAgent('');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedOrder(null);
    setSelectedAgent('');
  };

  const assignDeliveryAgent = async () => {
    if (!selectedAgent) {
      alert('Please select a delivery agent');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('http://localhost:5000/api/delivery/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          deliveryAgentId: selectedAgent,
        }),
      });

      if (response.ok) {
        // Emit socket event for delivery agent
        if (socket && connected) {
          socket.emit('orderAssigned', {
            deliveryAgentId: selectedAgent,
            orderId: selectedOrder._id,
            totalPrice: selectedOrder.totalPrice
          });
        }

        alert('Delivery agent assigned successfully! 🚚');
        closeAssignModal();
        fetchOrders();
      } else {
        alert('Failed to assign delivery agent');
      }
    } catch (error) {
      console.error('Error assigning delivery agent:', error);
      alert('Failed to assign delivery agent');
    } finally {
      setAssigning(false);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/menu/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('Menu item deleted!');
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete item');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      'out-for-delivery': 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-white mr-2" />
              <h1 className="text-2xl font-bold text-white">Restaurant Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              {connected && (
                <div className="flex items-center bg-green-500 bg-opacity-20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-white">Live</span>
                </div>
              )}

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
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package className="w-5 h-5 inline-block mr-2" />
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ShoppingBag className="w-5 h-5 inline-block mr-2" />
              Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {/* Menu Management Tab */}
        {!loading && activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Menu Items</h2>
              <button
                onClick={() => navigate('/restaurant/add-menu-item')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add New Item
              </button>
            </div>

            {menuItems.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No menu items yet
                </h3>
                <p className="text-gray-500 mb-6">Start by adding your first menu item</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-20 h-20 text-white opacity-50" />
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        <span className="text-lg font-bold text-blue-600">
                          ${item.price}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full mb-4">
                        {item.category}
                      </span>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/restaurant/edit-menu-item/${item._id}`)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item._id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {!loading && activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Orders</h2>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-500">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Customer: {order.customer?.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.deliveryAgent && (
                          <p className="text-blue-600 text-sm font-semibold mt-1">
                            <Truck className="w-4 h-4 inline-block mr-1" />
                            Assigned to: {order.deliveryAgent.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-gray-800 mt-2">
                          ${order.totalPrice}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
                      <ul className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.menuItem?.name}
                            </span>
                            <span className="text-gray-800 font-semibold">
                              ${(item.menuItem?.price * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.status !== 'delivered' && (
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'accepted')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
                          >
                            Accept Order
                          </button>
                        )}
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order._id, 'out-for-delivery')}
                              className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-all"
                            >
                              Ready for Delivery
                            </button>
                            {!order.deliveryAgent && (
                              <button
                                onClick={() => openAssignModal(order)}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Assign Delivery
                              </button>
                            )}
                          </>
                        )}
                        {order.status === 'out-for-delivery' && !order.deliveryAgent && (
                          <button
                            onClick={() => openAssignModal(order)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Assign Delivery Agent
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Delivery Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Assign Delivery Agent</h3>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Order #{selectedOrder?._id.slice(-6)} - ${selectedOrder?.totalPrice}
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Delivery Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
              >
                <option value="">Choose a delivery agent...</option>
                {deliveryAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>

              {deliveryAgents.length === 0 && (
                <p className="text-red-500 text-sm mt-2">
                  No delivery agents available. Please register delivery agents first.
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeAssignModal}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={assignDeliveryAgent}
                disabled={!selectedAgent || assigning}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {assigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5 mr-2" />
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;