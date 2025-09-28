import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';
import orderService, { Order, OrderStatus } from '../../services/orderService';
import returnService, { ReturnStatus } from '../../services/returnService';
import { AdjustmentsHorizontalIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export enum OrderTimeFilter {
  ALL = 'anytime',
  LAST_30_DAYS = 'last 30 days',
  LAST_6_MONTHS = 'last 6 months',
  LAST_YEAR = 'last year'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [timeFilter, setTimeFilter] = useState<OrderTimeFilter>(OrderTimeFilter.ALL);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Cancellation reasons based on order status
  const getCancellationReasons = (status: OrderStatus): string[] => {
    if (status === OrderStatus.ORDER_PLACED) {
      return [
        "Changed mind",
        "Found better price",
        "Delivery timeframe too long",
        "Other"
      ];
    } else if (status === OrderStatus.PROCESSING) {
      return [
        "Processing delay",
        "Payment issue",
        "Duplicate order",
        "Other"
      ];
    }
    return [];
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ordersData = await orderService.getUserOrders();
        // Sort orders by date, most recent first
        ordersData.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        
        // Sync each order with its return request status
        const updatedOrders = await Promise.all(
          ordersData.map(async (order) => {
            return await syncOrderWithReturnStatus(order);
          })
        );
        
        setOrders(updatedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // New function to sync order status with return status
  const syncOrderWithReturnStatus = async (order: Order): Promise<Order> => {
    try {
      const returnData = await returnService.getOrderReturns(order.id);
      if (Array.isArray(returnData) && returnData.length > 0) {
        // Check if there's an active return request
        const active = returnData.find(r => 
          r.status !== ReturnStatus.CANCELLED && 
          r.status !== ReturnStatus.REFUNDED
        );
        
        if (active) {
          const updatedOrder = { ...order };
          
          // Map the return status to the appropriate order status for display
          switch (active.status) {
            case ReturnStatus.REQUESTED:
              updatedOrder.status = OrderStatus.RETURN_REQUESTED;
              break;
              case ReturnStatus.APPROVED:
                updatedOrder.status = OrderStatus.RETURN_APPROVED;
                break;
            case ReturnStatus.PROCESSED:
              // Check if all items were returned (full return) or some items (partial)
              const totalOrderItems = order.items ? order.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
              const totalReturnedItems = active.returnItems ? active.returnItems.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;
              updatedOrder.status = totalOrderItems === totalReturnedItems ? 
                OrderStatus.RETURNED : OrderStatus.PARTIALLY_RETURNED;
              break;
            case ReturnStatus.REFUND_INITIATED:
              updatedOrder.status = OrderStatus.REFUND_INITIATED;
              break;
            case ReturnStatus.REFUNDED:
              updatedOrder.status = OrderStatus.REFUNDED;
              break;
          }
          
          return updatedOrder;
        }
      }
      return order;
    } catch (err) {
      console.error(`Failed to fetch return requests for order ${order.id}:`, err);
      return order;
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined) return "₹0.00";
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

  const retryFetchOrders = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const ordersData = await orderService.getUserOrders();
      // Sort orders by date, most recent first
      ordersData.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      
      // Sync each order with its return request status
      const updatedOrders = await Promise.all(
        ordersData.map(async (order) => {
          return await syncOrderWithReturnStatus(order);
        })
      );
      
      setOrders(updatedOrders);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const getDateFilterStart = (filter: OrderTimeFilter): Date | null => {
    const today = new Date();
    
    switch (filter) {
      case OrderTimeFilter.LAST_30_DAYS:
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 30);
        return lastMonth;
      case OrderTimeFilter.LAST_6_MONTHS:
        const last6Months = new Date();
        last6Months.setMonth(today.getMonth() - 6);
        return last6Months;
      case OrderTimeFilter.LAST_YEAR:
        const lastYear = new Date();
        lastYear.setFullYear(today.getFullYear() - 1);
        return lastYear;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'ALL' && statusFilter in OrderStatus && order.status !== statusFilter) {
      return false;
    }
    
    // Apply time filter
    if (timeFilter !== OrderTimeFilter.ALL) {
      const filterStartDate = getDateFilterStart(timeFilter);
      if (filterStartDate) {
        const orderDate = new Date(order.placedAt);
        return orderDate >= filterStartDate;
      }
    }
    
    return true;
  });

  const openCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelModalOpen(true);
    
    // Set default reason based on order status
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const reasons = getCancellationReasons(order.status);
      setCancelReason(reasons.length > 0 ? reasons[0] : '');
    } else {
      setCancelReason('');
    }
    
    setCancelSuccess(false);
  };
  
  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedOrderId(null);
    setCancelReason('');
    setCancelSuccess(false);
  };
  
  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(selectedOrderId, cancelReason);
      
      // Update the order in the list
      const updatedOrders = orders.map(order => 
        order.id === selectedOrderId 
          ? { ...order, status: OrderStatus.CANCELLED } 
          : order
      );
      setOrders(updatedOrders);
      
      setCancelSuccess(true);
      setTimeout(() => {
        closeCancelModal();
      }, 2000);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const canCancelOrder = (order: Order): boolean => {
    // Allow cancellation only for ORDER_PLACED or PROCESSING status
    return order.status === OrderStatus.ORDER_PLACED || 
           order.status === OrderStatus.PROCESSING;
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setTimeFilter(OrderTimeFilter.ALL);
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  // Format status text for header - capitalize first letter of each word
  const formatStatusText = (status: string): string => {
    if (status === 'ALL') return 'All';
    
    // Special handling for return status
    if (status === OrderStatus.RETURN_REQUESTED) {
      return 'Return Requested';
    }
    
    // Standard formatting for other statuses
    return status.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFilterHeaderText = () => {
    if (statusFilter === 'ALL' && timeFilter === OrderTimeFilter.ALL) {
      return 'All orders';
    } else if (statusFilter !== 'ALL' && timeFilter === OrderTimeFilter.ALL) {
      return `${formatStatusText(statusFilter)} orders`;
    } else if (statusFilter === 'ALL' && timeFilter !== OrderTimeFilter.ALL) {
      return `All orders`;
    } else {
      return `${formatStatusText(statusFilter)} orders`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{getFilterHeaderText()}</h1>
            <p className="text-sm text-gray-500">from {timeFilter}</p>
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            onClick={handleFilterToggle}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-500" />
            FILTER
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={retryFetchOrders} 
              className="text-red-700 font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet or no orders match your filter criteria.</p>
            <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{String(order.id).padStart(6, '0')}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${getStatusBadgeClass(order.status)}`}>
                      {formatStatusText(order.status)}
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          className="h-20 w-20 object-cover rounded-md border border-gray-200" 
                          src={order.items[0].productImageUrl || '/placeholder-product.jpg'} 
                          alt={order.items[0].productName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium mb-1">{order.items[0].productName}</p>
                        {order.items.length > 1 && (
                          <p className="text-sm text-gray-500">+ {order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 mb-4">
                    <p>Placed on: {formatDate(order.placedAt)}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-lg font-medium text-primary">
                      {formatPrice(order.grandTotal)}
                    </div>
                    
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sm font-medium text-teal-600 hover:text-teal-800"
                    >
                      View Order Details →
                    </Link>
                  </div>

                  {canCancelOrder(order) && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openCancelModal(order.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Filter Popup */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filter Orders</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium mb-4 text-gray-900">Status</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={statusFilter === 'ALL'}
                    onChange={() => setStatusFilter('ALL')}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">All</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={statusFilter === OrderStatus.SHIPPED}
                    onChange={() => setStatusFilter(OrderStatus.SHIPPED)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">On the way</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={statusFilter === OrderStatus.DELIVERED}
                    onChange={() => setStatusFilter(OrderStatus.DELIVERED)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Delivered</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={statusFilter === OrderStatus.CANCELLED}
                    onChange={() => setStatusFilter(OrderStatus.CANCELLED)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Cancelled</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={statusFilter === OrderStatus.RETURNED}
                    onChange={() => setStatusFilter(OrderStatus.RETURNED)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Returned</span>
                </label>
              </div>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium mb-4 text-gray-900">Time</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={timeFilter === OrderTimeFilter.ALL}
                    onChange={() => setTimeFilter(OrderTimeFilter.ALL)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Anytime</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={timeFilter === OrderTimeFilter.LAST_30_DAYS}
                    onChange={() => setTimeFilter(OrderTimeFilter.LAST_30_DAYS)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Last 30 days</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={timeFilter === OrderTimeFilter.LAST_6_MONTHS}
                    onChange={() => setTimeFilter(OrderTimeFilter.LAST_6_MONTHS)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Last 6 months</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={timeFilter === OrderTimeFilter.LAST_YEAR}
                    onChange={() => setTimeFilter(OrderTimeFilter.LAST_YEAR)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-gray-900">Last year</span>
                </label>
              </div>
            </div>
            
            <div className="p-4 flex gap-2">
              <button 
                onClick={clearFilters}
                className="w-1/2 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                CLEAR FILTERS
              </button>
              <button 
                onClick={applyFilters}
                className="w-1/2 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
              <button 
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-500"
                disabled={isCancelling}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {cancelSuccess ? (
              <div className="text-center py-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium mb-1">Order cancelled successfully!</p>
                <p className="text-gray-500 text-sm">You will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                
                <div className="mb-4">
                  <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation (optional)
                  </label>
                  <select
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-gray-700 text-sm focus:ring-primary focus:border-primary"
                    disabled={isCancelling}
                  >
                    <option value="">Select a reason</option>
                    {getCancellationReasons(selectedOrderId ? orders.find(o => o.id === selectedOrderId)?.status || OrderStatus.ORDER_PLACED : OrderStatus.ORDER_PLACED).map((reason, index) => (
                      <option key={index} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                    disabled={isCancelling}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 