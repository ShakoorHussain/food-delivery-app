import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../auth/SocketContext";
import MapView from "../shared/MapView";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !connected) return;

    console.log("🚚 Setting up delivery agent socket listeners");

    socket.on("orderAssigned", (data) => {
      if (data.deliveryAgentId === user._id) {
        console.log("📦 New order assigned:", data);
        fetchAssignedOrders();

        if (Notification.permission === "granted") {
          new Notification("New Delivery Assigned!", {
            body: `Order #${data.orderId.slice(-6)} - $${data.totalPrice}`,
            icon: "/logo.png",
          });
        }
      }
    });

    socket.on("orderStatusUpdated", (data) => {
      console.log("📦 Order status updated:", data);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.orderId ? { ...order, status: data.status } : order
        )
      );
    });

    return () => {
      socket.off("orderAssigned");
      socket.off("orderStatusUpdated");
    };
  }, [socket, connected, user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchOptimizedRoute = async () => {
    try {
      const response = await fetch(
        "https://food-delivery-backend-fiuj.onrender.com/api/delivery/route/optimize",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOptimizedRoute(data);
        setShowRouteModal(true);
        console.log("✅ Optimized Route:", data);
      }
    } catch (error) {
      console.error("Error fetching optimized route:", error);
    }
  };

  const fetchAssignedOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "https://food-delivery-backend-fiuj.onrender.com/api/delivery/orders",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data);

        if (socket && connected) {
          data.forEach((order) => {
            socket.emit("joinOrder", order._id);
          });
        }
      } else {
        setError("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `https://food-delivery-backend-fiuj.onrender.com/api/delivery/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert("Delivery status updated! 🚚");
        fetchAssignedOrders();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      "out-for-delivery": "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    if (status === "delivered") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <Truck className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-white mr-2" />
              <h1 className="text-2xl font-bold text-white">
                Delivery Dashboard
              </h1>
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
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {orders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  In Transit
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {orders.filter((o) => o.status === "out-for-delivery").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Delivered</p>
                <p className="text-3xl font-bold text-gray-800">
                  {orders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Orders List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Your Deliveries
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={fetchOptimizedRoute}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Optimize Route
              </button>
              <button
                onClick={fetchAssignedOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading deliveries...</p>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <Truck className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No deliveries assigned
              </h3>
              <p className="text-gray-500">
                Orders will appear here when assigned to you
              </p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>Customer: {order.customer?.name}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-2 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <p className="text-lg font-bold text-gray-800">
                        ${order.totalPrice}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                      Order Items:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {item.quantity}x {item.menuItem?.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Delivery Time */}
                  {order.estimatedDeliveryTime && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-700">
                          <Clock className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-semibold">
                            Estimated Delivery:
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">
                          {new Date(
                            order.estimatedDeliveryTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {order.status === "out-for-delivery" && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(order._id, "delivered")
                      }
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mark as Delivered
                    </button>
                  )}

                  {order.status === "delivered" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-semibold">
                        Delivery Completed
                      </p>
                    </div>
                  )}

                  {order.status !== "out-for-delivery" &&
                    order.status !== "delivered" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-yellow-800 text-sm">
                          Waiting for restaurant to mark as ready for delivery
                        </p>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optimized Route Modal */}
      {showRouteModal && optimizedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Optimized Delivery Route
              </h3>
              <button
                onClick={() => setShowRouteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {optimizedRoute.optimizedRoute.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No active deliveries to optimize
                </p>
              </div>
            ) : (
              <div>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-blue-600 text-sm font-semibold">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {optimizedRoute.ordersCount}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-green-600 text-sm font-semibold">
                      Total Distance
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {optimizedRoute.totalDistance} km
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-orange-600 text-sm font-semibold">
                      Est. Time
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {optimizedRoute.estimatedTime} min
                    </p>
                  </div>
                </div>

                {/* Map View */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Route Map
                  </h4>
                  <MapView
                    center={[
                      optimizedRoute.startLocation.lat,
                      optimizedRoute.startLocation.lng,
                    ]}
                    zoom={12}
                    height="300px"
                    markers={[
                      {
                        lat: optimizedRoute.startLocation.lat,
                        lng: optimizedRoute.startLocation.lng,
                        name: "Start Location",
                        type: "restaurant",
                        info: "Your starting point",
                      },
                      ...optimizedRoute.optimizedRoute.map((stop, index) => ({
                        lat: stop.lat,
                        lng: stop.lng,
                        name: `Stop ${index + 1}: ${stop.customerName}`,
                        address: stop.address,
                        type: "delivery",
                        info: `${stop.distanceFromPrevious.toFixed(
                          2
                        )} km from previous`,
                      })),
                    ]}
                    route={[
                      optimizedRoute.startLocation,
                      ...optimizedRoute.optimizedRoute.map((stop) => ({
                        lat: stop.lat,
                        lng: stop.lng,
                      })),
                    ]}
                  />
                </div>

                {/* Route Steps */}
                <div className="space-y-3">
                  {/* Start Location */}
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Start Location
                      </p>
                      <p className="text-sm text-gray-600">
                        Lat: {optimizedRoute.startLocation.lat}, Lng:{" "}
                        {optimizedRoute.startLocation.lng}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Stops */}
                  {optimizedRoute.optimizedRoute.map((stop, index) => (
                    <div
                      key={stop.orderId}
                      className="flex items-start space-x-3"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                          <span className="text-white font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {stop.customerName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {stop.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">
                              ${stop.totalPrice}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {stop.distanceFromPrevious.toFixed(2)} km
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            ~{Math.ceil((stop.distanceFromPrevious / 30) * 60)}{" "}
                            min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;