import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import orderService, { Order, OrderStatus } from '../../services/orderService';
import {
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import userService from '../../services/userService';

export default function AdminOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = useParams<{ email: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Status update state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  // Determine if we're in admin view or regular orders view
  const isAdminView = location.pathname.includes('/admin/');

  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        let data: Order[];
        let userName = '';

        if (email) {
          // If email is provided, get orders for that specific user
          // Also fetch the user's name
          try {
            const userData = await userService.getUserByEmail(email);
            userName = `${userData.firstName} ${userData.lastName}`;
          } catch (userErr) {
            console.error(`Failed to fetch user details for ${email}:`, userErr);
          }

          data = await orderService.getUserOrdersByEmail(email);
        } else {
          // Otherwise get all orders
          data = await orderService.getAllOrders();
        }

        // Store the user's name if we have it
        if (userName) {
          sessionStorage.setItem(`user_name_${email}`, userName);
        }

        // Sort orders by date, most recent first
        data.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate, email]);

  const formatPrice = (price: number) => {
    if (isNaN(price)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ORDER_PLACED:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.RETURNED:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.PARTIALLY_RETURNED:
        return 'bg-amber-100 text-amber-800';
      case OrderStatus.REFUND_INITIATED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.REFUNDED:
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewOrderDetails = (orderId: number) => {
    // Navigate to the admin order details page to preserve the admin context
    navigate(`/admin/orders/${orderId}`);
  };

  const handleStatusUpdateClick = (orderId: number, currentStatus: OrderStatus) => {
    // Only allow status updates in admin view
    if (!isAdminView) return;

    setSelectedOrderId(orderId);
    setStatusModalOpen(true);

    // Set default new status to the next logical status
    if (currentStatus === OrderStatus.ORDER_PLACED) {
      setNewStatus(OrderStatus.PROCESSING);
    } else if (currentStatus === OrderStatus.PROCESSING) {
      setNewStatus(OrderStatus.SHIPPED);
    } else if (currentStatus === OrderStatus.SHIPPED) {
      setNewStatus(OrderStatus.DELIVERED);
    } else {
      setNewStatus('');
    }
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedOrderId(null);
    setNewStatus('');
    setTrackingNumber('');
    setStatusUpdateSuccess(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrderId || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        selectedOrderId,
        newStatus as OrderStatus,
        newStatus === OrderStatus.SHIPPED ? trackingNumber : undefined
      );

      // Update order in the list
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderId ? updatedOrder : order
        )
      );

      setStatusUpdateSuccess(true);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const getDateFilterStart = (filter: string): Date | null => {
    const today = new Date();
    switch (filter) {
      case 'TODAY':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
      case 'LAST_WEEK':
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        return lastWeek;
      case 'LAST_MONTH':
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        return lastMonth;
      case 'LAST_3_MONTHS':
        const last3Months = new Date();
        last3Months.setMonth(today.getMonth() - 3);
        return last3Months;
      case 'LAST_6_MONTHS':
        const last6Months = new Date();
        last6Months.setMonth(today.getMonth() - 6);
        return last6Months;
      case 'THIS_YEAR':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return startOfYear;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }

    // Apply date filter
    if (dateFilter !== 'ALL') {
      const filterStartDate = getDateFilterStart(dateFilter);
      if (filterStartDate) {
        const orderDate = new Date(order.placedAt);
        return orderDate >= filterStartDate;
      }
    }

    return true;
  });


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {!email && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Back Button */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center bg-white text-primary border border-primary px-4 py-2 rounded-lg shadow hover:bg-primary hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </div>

            {/* Center: Page Title */}
            <div className="flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {email ? `Orders for ${sessionStorage.getItem(`user_name_${email}`) || email}` : 'Manage Orders'}
                </h1>
                {!email && <p className="text-sm text-gray-500">Admin control panel for customer orders</p>}
              </div>
            </div>

            {/* Right: Filters Button */}
            <div className="relative inline-block text-left">
              <Button
                onClick={handleFilterToggle}
                variant="outline"
                className="inline-flex justify-between items-center w-56 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <span>Filters</span>
                <AdjustmentsHorizontalIcon className="h-5 w-5 ml-2 text-gray-500" />
              </Button>
            </div>
          </div>
        )}

        {isFilterOpen && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="relative inline-block w-full">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                    className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="ALL">All Statuses</option>
                    {Object.values(OrderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="relative inline-block w-full">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="LAST_WEEK">Last 7 Days</option>
                    <option value="LAST_MONTH">Last 30 Days</option>
                    <option value="LAST_3_MONTHS">Last 3 Months</option>
                    <option value="LAST_6_MONTHS">Last 6 Months</option>
                    <option value="THIS_YEAR">This Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">There are no orders matching your filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{String(order.id).padStart(6, '0')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customerName || 'Customer'}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.placedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatPrice(order.grandTotal)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleViewOrderDetails(order.id)}
                          className="text-primary hover:text-primary-dark"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {isAdminView && (
                          <button
                            onClick={() => handleStatusUpdateClick(order.id, order.status)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Update Status"
                            disabled={
                              [OrderStatus.CANCELLED, OrderStatus.RETURNED,
                              OrderStatus.PARTIALLY_RETURNED, OrderStatus.REFUNDED,
                              OrderStatus.REFUND_INITIATED].includes(order.status as OrderStatus)
                            }
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Status Update Modal */}
        {statusModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-xl font-medium text-gray-900">
                  {statusUpdateSuccess ? 'Status Updated' : 'Update Order Status'}
                </h2>
                <button
                  onClick={closeStatusModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {statusUpdateSuccess ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Status Updated Successfully</h3>
                  <p className="text-gray-600 mb-6">The order status has been updated.</p>
                  <Button onClick={closeStatusModal}>Close</Button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      New Status*
                    </label>
                    <div className="relative">
                      <select
                        id="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        required
                      >
                        <option value="">Select Status</option>
                        <option value={OrderStatus.PROCESSING}>Processing</option>
                        <option value={OrderStatus.SHIPPED}>Shipped</option>
                        <option value={OrderStatus.DELIVERED}>Delivered</option>
                        <option value={OrderStatus.CANCELLED}>Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {newStatus === OrderStatus.SHIPPED && (
                    <div className="mb-4">
                      <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number*
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="trackingNumber"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                          required
                          placeholder="Enter tracking number"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={closeStatusModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={isUpdatingStatus || !newStatus || (newStatus === OrderStatus.SHIPPED && !trackingNumber)}
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 