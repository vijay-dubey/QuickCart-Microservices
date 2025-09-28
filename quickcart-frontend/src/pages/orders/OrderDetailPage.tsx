import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import orderService, { Order, OrderStatus } from '../../services/orderService';
import { CheckCircleIcon, ArrowLeftIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import returnService, { ReturnItem, ReturnStatus } from '../../services/returnService';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isAdminView = location.pathname.includes('/admin/');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fromCheckout = new URLSearchParams(location.search).get('fromCheckout') === 'true';
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ productId: number, quantity: number }[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  // Return request state
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [activeReturnRequest, setActiveReturnRequest] = useState<any | null>(null);
  const [isCancellingReturn, setIsCancellingReturn] = useState(false);
  const [cancelReturnSuccess, setCancelReturnSuccess] = useState(false);
  const [cancelReturnModalOpen, setCancelReturnModalOpen] = useState(false);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Cancel order state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
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
    const fetchOrder = async () => {
      if (!orderId) return;

      setIsLoading(true);
      setError(null);
      try {
        const orderData = await orderService.getOrderDetails(orderId);

        // Ensure the order totals are calculated correctly
        if (orderData.grandTotal === 0 && orderData.items?.length > 0) {
          // Calculate the totals if they're missing
          const calculatedSubtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shippingFee = orderData.shippingFee || 90;
          const cgst = orderData.cgstAmount || (calculatedSubtotal * 0.09); // 9% CGST
          const sgst = orderData.sgstAmount || (calculatedSubtotal * 0.09); // 9% SGST

          orderData.totalAmount = calculatedSubtotal;
          orderData.shippingFee = shippingFee;
          orderData.cgstAmount = cgst;
          orderData.sgstAmount = sgst;
          orderData.grandTotal = calculatedSubtotal + shippingFee + cgst + sgst;
        }

        setOrder(orderData);

        // Set up selected items for return
        if (orderData.items) {
          setSelectedItems(
            orderData.items.map(item => ({
              productId: item.productId,
              quantity: 0
            }))
          );
        }

        // Fetch return requests for this order immediately
        await fetchReturnRequests(orderId, orderData);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError('You do not have permission to view this order.');
        } else {
          setError('Failed to load order details. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const fetchReturnRequests = async (orderId: number, currentOrder: Order) => {
    try {
      const returnRequests = await returnService.getOrderReturns(orderId);
      setReturnRequests(returnRequests);

      if (Array.isArray(returnRequests) && returnRequests.length > 0) {
        const active = returnRequests.find(
          r => r.status !== ReturnStatus.CANCELLED && r.status !== ReturnStatus.REFUNDED
        );

        if (active) {
          const returnItems = await returnService.getReturnItemsForRequest(active.id);

          const enrichedReturnItems = await Promise.all(
            returnItems.map(async (item) => {
              try {
                const orderItem = await orderService.getOrderItemById(item.orderItemId);
                return {
                  ...item,
                  productName: orderItem.productName,
                  productPrice: orderItem.price,
                  imageUrl: orderItem.productImageUrl,
                };
              } catch (err) {
                console.error(`Failed to fetch order item ${item.orderItemId}`, err);
                return item; // fallback
              }
            })
          );

          active.returnItems = enrichedReturnItems;
          setActiveReturnRequest(active);

          let updatedOrder = { ...currentOrder };

          switch (active.status) {
            case 'REQUESTED':
              updatedOrder.status = OrderStatus.RETURN_REQUESTED;
              break;
            case 'APPROVED':
              updatedOrder.status = OrderStatus.RETURN_APPROVED;
              break;
            case 'PROCESSED':
              const totalOrderItems = (updatedOrder.items || []).reduce((sum, item) => sum + item.quantity, 0);
              const totalReturnedItems = (active.returnItems || []).reduce((sum, item) => sum + item.quantity, 0);
              updatedOrder.status = totalOrderItems === totalReturnedItems
                ? OrderStatus.RETURNED
                : OrderStatus.PARTIALLY_RETURNED;
              break;
            case 'REFUND_INITIATED':
              updatedOrder.status = OrderStatus.REFUND_INITIATED;
              break;
            case 'REFUNDED':
              updatedOrder.status = OrderStatus.REFUNDED;
              break;
            default:
              break; // Optional: fallback
          }

          setOrder(updatedOrder);
        } else {
          setActiveReturnRequest(null); // fallback when no active request
        }
      } else {
        setReturnRequests([]);
        setActiveReturnRequest(null);
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
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

  const formatDate = (dateString: string | undefined) => {
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
      case OrderStatus.RETURN_REQUESTED:
        return 'bg-amber-100 text-amber-800';
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

  // Helper function to format order status for display
  const formatOrderStatus = (status: OrderStatus): string => {
    if (status === OrderStatus.RETURN_REQUESTED) {
      // Override the display for return requested status to be clearer
      return "Return Requested";
    }

    // For other statuses, replace underscores with spaces and capitalize each word
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleBackToOrders = () => {
    // Check if we came from return details page
    const fromReturn = location.state?.fromReturn;

    if (fromReturn && isAdmin) {
      navigate(`/admin/returns/${fromReturn}`);
    } else if (isAdminView) {
      navigate('/admin/orders');
    } else {
      navigate('/orders');
    }
  };

  const getOrderProgress = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ORDER_PLACED:
        return 1;
      case OrderStatus.PROCESSING:
        return 2;
      case OrderStatus.SHIPPED:
        return 3;
      case OrderStatus.DELIVERED:
        return 4;
      case OrderStatus.CANCELLED:
      case OrderStatus.RETURNED:
      case OrderStatus.PARTIALLY_RETURNED:
      case OrderStatus.REFUND_INITIATED:
      case OrderStatus.REFUNDED:
        return -1; // Special case for cancelled/returned orders
      default:
        return 0;
    }
  };

  const renderOrderProgressBar = () => {
    if (!order) return null;

    // For cancelled orders, show progress up to the point it was cancelled
    let progress = getOrderProgress(order.status);

    // If order is cancelled, show progress until it was cancelled
    if (order.status === OrderStatus.CANCELLED) {
      // Determine how far the order got before cancellation
      if (order.shippedAt) {
        progress = 3; // Shipped
      } else if (order.placedAt) {
        // If we have no shipping info but the order exists, it was at least in processing
        progress = 2; // Processing
      } else {
        progress = 1; // Order Placed
      }
    }

    // For active return requests, show extended status
    let returnProgress = 0;
    let hasReturnProcess = false;

    const returnSteps = [
      { name: 'Return Requested', status: 'upcoming' },
      { name: 'Return Approved', status: 'upcoming' },
      { name: 'Return Processed', status: 'upcoming' },
      { name: 'Refund Initiated', status: 'upcoming' },
      { name: 'Refund Completed', status: 'upcoming' }
    ];

    if (activeReturnRequest) {
      hasReturnProcess = true;
      switch (activeReturnRequest.status) {
        case 'REQUESTED':
          returnProgress = 1;
          break;
        case 'APPROVED':
          returnProgress = 2;
          break;
        case 'PROCESSED':
          returnProgress = 3;
          break;
        case 'REFUND_INITIATED':
          returnProgress = 4;
          break;
        case 'REFUNDED':
          returnProgress = 5;
          break;
      }

      // Update return steps status
      returnSteps.forEach((step, index) => {
        if (index < returnProgress) {
          step.status = 'complete';
        } else if (index === returnProgress) {
          step.status = 'current';
        }
      });
    }

    // For cancelled orders, add a cancelled indicator
    if (order.status === OrderStatus.CANCELLED) {
      const stepsWithCancelled = [
        { name: 'Order Placed', status: progress >= 1 ? 'complete' : 'upcoming' },
        { name: 'Processing', status: progress >= 2 ? 'complete' : 'upcoming' },
        { name: 'Shipped', status: progress >= 3 ? 'complete' : 'upcoming' },
        { name: 'Cancelled', status: 'cancelled' }
      ];

      return (
        <div className="my-6">
          <div className="flex items-center justify-between">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(progress / 3) * 75}%` }}
              ></div>
              <div
                className="h-full bg-red-500 rounded-full relative -top-2"
                style={{ width: '25%', marginLeft: `${(progress / 3) * 75}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            {stepsWithCancelled.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${step.status === 'complete'
                    ? 'bg-primary text-white'
                    : step.status === 'cancelled'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {step.status === 'complete' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : step.status === 'cancelled' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${step.status === 'complete'
                    ? 'text-primary'
                    : step.status === 'cancelled'
                      ? 'text-red-600'
                      : 'text-gray-500'
                    }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const steps = [
      { name: 'Order Placed', status: progress >= 1 ? 'complete' : 'upcoming' },
      { name: 'Processing', status: progress >= 2 ? 'complete' : 'upcoming' },
      { name: 'Shipped', status: progress >= 3 ? 'complete' : 'upcoming' },
      { name: 'Delivered', status: progress >= 4 ? 'complete' : 'upcoming' }
    ];

    // If there's an active return process, show extended status bar
    if (hasReturnProcess) {
      return (
        <div className="my-6">
          {/* Main Order Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `100%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="mt-1 text-xs font-medium text-primary">
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Return Process */}
          <h3 className="font-medium text-gray-800 mb-2">Return Status</h3>
          <div className="flex items-center justify-between">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(returnProgress / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            {returnSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${step.status === 'complete'
                    ? 'bg-amber-500 text-white'
                    : step.status === 'current'
                      ? 'bg-amber-400 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {step.status === 'complete' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${step.status === 'complete' || step.status === 'current'
                    ? 'text-amber-600'
                    : 'text-gray-500'
                    }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="my-6">
        <div className="flex items-center justify-between">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(progress / 4) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full ${step.status === 'complete'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${step.status === 'complete'
                  ? 'text-primary'
                  : 'text-gray-500'
                  }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleRequestReturn = () => {
    setReturnModalOpen(true);
    if (order?.items) {
      // Initialize with zero quantity for all items
      setSelectedItems(order.items.map(item => ({ productId: item.productId, quantity: 0 })));
    }
  };

  const handleItemReturnChange = (productId: number | null | undefined, quantity: number) => {
    if (!productId) return; // Don't process if productId is null or undefined

    setSelectedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleReturnSubmit = async () => {
    if (!order || !selectedItems.length) return;

    // Filter out items with zero quantity
    const itemsToReturn = selectedItems.filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    if (!returnReason.trim()) {
      alert('Please provide a reason for return');
      return;
    }

    setIsProcessingReturn(true);
    try {
      // Pass the filtered items and reason to the API
      await orderService.requestReturn(
        order.id,
        itemsToReturn,
        returnReason || 'Product damaged' // Default reason if somehow empty
      );

      setReturnSuccess(true);

      // Refresh order and return requests after creating return
      const updatedOrder = await orderService.getOrderDetails(orderId);
      setOrder(updatedOrder);
      await fetchReturnRequests(orderId, updatedOrder);

      // Close the modal after a short delay
      setTimeout(() => {
        closeReturnModal();
      }, 2000);
    } catch (err) {
      console.error('Failed to request return:', err);
      alert('Failed to process return request. Please try again.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setReturnSuccess(false);
    setReturnReason('');
  };

  const handleStatusUpdateClick = () => {
    setStatusModalOpen(true);
    // Set default new status to the next logical status
    if (order) {
      if (order.status === OrderStatus.ORDER_PLACED) {
        setNewStatus(OrderStatus.PROCESSING);
      } else if (order.status === OrderStatus.PROCESSING) {
        setNewStatus(OrderStatus.SHIPPED);
      } else if (order.status === OrderStatus.SHIPPED) {
        setNewStatus(OrderStatus.DELIVERED);
      } else {
        setNewStatus('');
      }
    }
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setNewStatus('');
    setTrackingNumber('');
    setStatusUpdateSuccess(false);
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        order.id,
        newStatus as OrderStatus,
        newStatus === OrderStatus.SHIPPED ? trackingNumber : undefined
      );
      setOrder(updatedOrder);
      setStatusUpdateSuccess(true);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openCancelModal = () => {
    setCancelModalOpen(true);

    // Set default reason based on order status
    if (order) {
      const reasons = getCancellationReasons(order.status);
      setCancelReason(reasons.length > 0 ? reasons[0] : '');
    } else {
      setCancelReason('');
    }

    setCancelSuccess(false);
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      const updatedOrder = await orderService.cancelOrder(order.id, cancelReason);
      setOrder(updatedOrder);
      setCancelSuccess(true);
      setTimeout(() => {
        setCancelModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setCancelReason('');
    setCancelSuccess(false);
  };

  const canCancelOrder = (): boolean => {
    if (!order) return false;

    // Allow cancellation only for ORDER_PLACED or PROCESSING status
    return order.status === OrderStatus.ORDER_PLACED || order.status === OrderStatus.PROCESSING;
  };

  const handleCancelReturnRequest = () => {
    if (!activeReturnRequest) return;
    setCancelReturnModalOpen(true);
    setCancelReturnSuccess(false);
  };

  const confirmCancelReturnRequest = async () => {
    if (!activeReturnRequest) return;

    setIsCancellingReturn(true);
    try {
      await orderService.cancelReturnRequest(activeReturnRequest.id);
      setCancelReturnSuccess(true);

      // Refresh the order data and return requests
      const updatedOrder = await orderService.getOrderDetails(orderId);
      setOrder(updatedOrder);
      await fetchReturnRequests(orderId, updatedOrder);

      // Reset active return request
      setActiveReturnRequest(null);

      setTimeout(() => {
        setCancelReturnModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to cancel return request:', err);
      setError('Failed to cancel return request. Please try again.');
    } finally {
      setIsCancellingReturn(false);
    }
  };

  const closeCancelReturnModal = () => {
    setCancelReturnModalOpen(false);
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
        {/* Success message when coming from checkout */}
        {fromCheckout && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
            <span>Your order has been successfully placed! We've sent a confirmation to your email.</span>
          </div>
        )}

        <div className="flex items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {!order ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={handleBackToOrders}>Back to Orders</Button>
          </div>
        ) : (
          <>
            {/* Order Header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order #{String(order.id).padStart(6, '0')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Placed on {formatDate(order.placedAt)}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                  {formatOrderStatus(order.status)}
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Payment Information</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900">Payment Method: {order.paymentMethod}</p>
                      <p className="text-sm text-gray-900">Payment Status: {order.paymentStatus}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Shipping Information</h3>
                    <div className="mt-2">
                      {order.status === OrderStatus.DELIVERED && (
                        <>
                          <p className="text-sm text-gray-900">Delivered on: {formatDate(order.deliveredAt)}</p>
                          {order.refundDeadline && (
                            <p className="text-sm text-gray-900">Return available until: {formatDate(order.refundDeadline)}</p>
                          )}
                        </>
                      )}
                      {order.status === OrderStatus.CANCELLED && (
                        <>
                          <p className="text-sm text-gray-900">Cancelled on: {formatDate(order.cancelledAt)}</p>
                          <p className="text-sm text-gray-900">Reason: {order.cancellationReason || "No reason provided"}</p>
                        </>
                      )}
                      {(order.status === OrderStatus.RETURNED || order.status === OrderStatus.PARTIALLY_RETURNED) && (
                        <p className="text-sm text-gray-600">Refund will be processed in 3 business days.</p>
                      )}
                      {activeReturnRequest && (
                        <>
                          <p className="text-sm text-gray-900 font-medium mt-2">Return Request Status: <span className="font-normal">{activeReturnRequest.status}</span></p>
                          <p className="text-sm text-gray-900 font-medium">Return Reason: <span className="font-normal">{activeReturnRequest.reason || "No reason provided"}</span></p>
                        </>
                      )}
                      {order.status === OrderStatus.SHIPPED && (
                        <>
                          {order.shippedAt && (
                            <p className="text-sm text-gray-900">Shipped on: {formatDate(order.shippedAt)}</p>
                          )}
                          {order.trackingNumber && (
                            <p className="text-sm text-gray-900">Tracking Number: {order.trackingNumber}</p>
                          )}
                          {order.expectedDeliveryDate && (
                            <p className="text-sm text-gray-900">Expected Delivery: {formatDate(order.expectedDeliveryDate)}</p>
                          )}
                        </>
                      )}
                      {(order.status === OrderStatus.ORDER_PLACED || order.status === OrderStatus.PROCESSING) && (
                        <>
                          {order.expectedDeliveryDate && (
                            <p className="text-sm text-gray-900">Expected Delivery: {formatDate(order.expectedDeliveryDate)}</p>
                          )}
                        </>
                      )}
                      {!order.shippedAt && !order.trackingNumber && !order.expectedDeliveryDate &&
                        order.status !== OrderStatus.DELIVERED &&
                        order.status !== OrderStatus.CANCELLED &&
                        order.status !== OrderStatus.RETURNED &&
                        order.status !== OrderStatus.PARTIALLY_RETURNED && (
                          <p className="text-sm text-gray-500">Shipping details will be updated soon.</p>
                        )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Order Summary</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-900">Total: {formatPrice(order.grandTotal)}</p>
                      <p className="text-sm text-gray-900">Items: {order.items?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Progress Bar */}
            {renderOrderProgressBar()}

            {/* Order Items */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items && order.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <Link to={item.productId ? `/products/${item.productId}` : '#'}>
                                  <img
                                    className="h-10 w-10 rounded-md object-cover"
                                    src={item.productImageUrl || '/placeholder-product.jpg'}
                                    alt={item.productName}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                    }}
                                  />
                                </Link>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  <Link to={item.productId ? `/products/${item.productId}` : '#'} className="hover:text-primary hover:underline">
                                    {item.productName}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Payment Details</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.totalAmount)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Shipping Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.shippingFee)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">CGST</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.cgstAmount)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">SGST</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.sgstAmount)}</dd>
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                    <dt className="text-base font-medium text-gray-900">Grand Total</dt>
                    <dd className="mt-1 text-base font-bold text-gray-900">
                      {formatPrice(
                        // Ensure non-null values by using || 0
                        (order.totalAmount || 0) +
                        (order.shippingFee || 0) +
                        (order.cgstAmount || 0) +
                        (order.sgstAmount || 0)
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Returned Items */}
            {activeReturnRequest?.returnItems && activeReturnRequest.returnItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Returned Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Refund Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeReturnRequest.returnItems.map((item: ReturnItem) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={item.imageUrl || '/placeholder-product.jpg'}
                                alt={item.productName}
                                className="h-20 w-20 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                }}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatPrice(item.productPrice)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatPrice(item.refundAmount)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">
                          Total Refund Amount:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(
                            activeReturnRequest.returnItems.reduce(
                              (total: number, item: ReturnItem) => total + (item.refundAmount || 0),
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <Button
                onClick={handleBackToOrders}
                className="flex items-center text-primary hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                {location.state?.fromReturn ? 'Back to Return' : 'Back to Orders'}
              </Button>

              <div className="flex gap-2">
                {/* Update Status button for admin view */}
                {isAdminView && order && ![OrderStatus.CANCELLED, OrderStatus.RETURNED, 
                  OrderStatus.PARTIALLY_RETURNED, OrderStatus.REFUNDED, 
                  OrderStatus.REFUND_INITIATED].includes(order.status as OrderStatus) && (
                  <Button
                    onClick={handleStatusUpdateClick}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Update Status
                  </Button>
                )}
                
                {/* Cancel Order button - only show for orders that can be cancelled and not in admin view */}
                {canCancelOrder() && !isAdminView && (
                  <Button
                    onClick={openCancelModal}
                    variant="danger"
                    size="sm"
                  >
                    Cancel Order
                  </Button>
                )}

                {/* Request Return button - only show for delivered orders without return requests */}
                {order.status === OrderStatus.DELIVERED && !activeReturnRequest && (
                  <Button
                    onClick={handleRequestReturn}
                    variant="secondary"
                    size="sm"
                  >
                    Request Return
                  </Button>
                )}

                {/* Cancel Return Request button - only show for orders with an active REQUESTED return request */}
                {order.status === OrderStatus.RETURN_REQUESTED && activeReturnRequest && activeReturnRequest.status === 'REQUESTED' && !(isAdmin && location.state?.fromReturn) && (
                  <Button
                    onClick={handleCancelReturnRequest}
                    variant="danger"
                    size="sm"
                  >
                    Cancel Return Request
                  </Button>
                )}
              </div>
            </div>

            {/* Return Modal */}
            {returnModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                  <div className="flex justify-between items-center border-b px-6 py-4">
                    <h2 className="text-xl font-medium text-gray-900">
                      {returnSuccess ? 'Return Request Submitted' : 'Request Return'}
                    </h2>
                    <button
                      onClick={closeReturnModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {returnSuccess ? (
                    <div className="p-6 text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Return Request Successful</h3>
                      <p className="text-gray-600 mb-6">Your return request has been submitted successfully. We'll process it shortly.</p>
                      <Button onClick={closeReturnModal}>Close</Button>
                    </div>
                  ) : (
                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Please select the items you want to return and provide a reason for the return.
                      </p>

                      <div className="border rounded-md overflow-hidden mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Product
                              </th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Ordered
                              </th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Return Qty
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.items && order.items.map(item => {
                              const currentItem = selectedItems.find(i => i.productId === item.productId);
                              const maxQty = item.quantity;
                              return (
                                <tr key={item.id}>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <Link to={item.productId ? `/products/${item.productId}` : '#'}>
                                          <img
                                            className="h-10 w-10 rounded-md object-cover"
                                            src={item.productImageUrl || '/placeholder-product.jpg'}
                                            alt={item.productName}
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                            }}
                                          />
                                        </Link>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          <Link to={item.productId ? `/products/${item.productId}` : '#'} className="hover:text-primary hover:underline">
                                            {item.productName}
                                          </Link>
                                        </div>
                                        <div className="text-sm text-gray-500">{formatPrice(item.price)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm text-gray-900">{maxQty}</span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center">
                                      <select
                                        className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        value={currentItem?.quantity || 0}
                                        onChange={(e) => item.productId ? handleItemReturnChange(item.productId, parseInt(e.target.value)) : null}
                                        disabled={!item.productId}
                                      >
                                        {Array.from({ length: maxQty + 1 }, (_, i) => i).map(num => (
                                          <option key={num} value={num}>{num}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-6">
                        <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Return *
                        </label>
                        <textarea
                          id="returnReason"
                          rows={3}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                          placeholder="Please provide a reason for your return request"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          required
                        ></textarea>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={closeReturnModal}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleReturnSubmit}
                          disabled={isProcessingReturn || selectedItems.every(item => item.quantity === 0)}
                        >
                          {isProcessingReturn ? 'Processing...' : 'Submit Return Request'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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

            {/* Cancel Modal */}
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
                        <div className="relative">
                          <select
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                            required
                          >
                            <option value="">Select Reason</option>
                            {getCancellationReasons(order.status).map((reason, index) => (
                              <option key={index} value={reason}>{reason}</option>
                            ))}
                          </select>
                        </div>
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

            {/* Cancel Return Modal */}
            {cancelReturnModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Cancel Return Request</h3>
                    <button
                      onClick={closeCancelReturnModal}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={isCancellingReturn}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {cancelReturnSuccess ? (
                    <div className="text-center py-4">
                      <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-medium mb-1">Return request cancelled successfully!</p>
                      <p className="text-gray-500 text-sm">Your order has been restored to its previous status.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">
                        Are you sure you want to cancel this return request? This action cannot be undone.
                      </p>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={closeCancelReturnModal}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                          disabled={isCancellingReturn}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmCancelReturnRequest}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                          disabled={isCancellingReturn}
                        >
                          {isCancellingReturn ? (
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


            {/* Modify the Return Request Management section to only show for admin users in admin context */}
            {isAdmin && activeReturnRequest && !location.state?.fromReturn && location.pathname.includes('/admin/') && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Return Request Management</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Update return request status for order #{String(order.id).padStart(6, '0')}</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="w-full sm:max-w-xs">
                      <label htmlFor="returnStatus" className="block text-sm font-medium text-gray-700">New Return Status</label>
                      <select
                        id="returnStatus"
                        name="returnStatus"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={activeReturnRequest.status}
                        onChange={(e) => {
                          const newReturnStatus = e.target.value;
                          if (window.confirm(`Are you sure you want to update the return status to ${newReturnStatus}?`)) {
                            orderService.updateReturnStatus(activeReturnRequest.id, newReturnStatus)
                              .then(async () => {
                                // Get the updated order and return data
                                setIsLoading(true);
                                try {
                                  const updatedOrder = await orderService.getOrderDetails(orderId);
                                  setOrder(updatedOrder);
                                  await fetchReturnRequests(orderId, updatedOrder);

                                } catch (err) {
                                  console.error('Failed to fetch updated order:', err);
                                } finally {
                                  setIsLoading(false);
                                }
                              })
                              .catch(err => {
                                console.error('Failed to update return status:', err);
                                alert('Failed to update return status. Please try again.');
                              });
                          }
                        }}
                      >
                        <option value={activeReturnRequest.status} disabled>{activeReturnRequest.status}</option>
                        {activeReturnRequest.status === 'REQUESTED' && (
                          <>
                            <option value="APPROVED">APPROVED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </>
                        )}
                        {activeReturnRequest.status === 'APPROVED' && (
                          <>
                            <option value="PROCESSED">PROCESSED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </>
                        )}
                        {activeReturnRequest.status === 'PROCESSED' && (
                          <option value="REFUND_INITIATED">REFUND_INITIATED</option>
                        )}
                        {activeReturnRequest.status === 'REFUND_INITIATED' && (
                          <option value="REFUNDED">REFUNDED</option>
                        )}
                      </select>
                    </div>
                    <Button
                      onClick={() => navigate(`/admin/returns/${activeReturnRequest.id}`)}
                      variant="primary"
                      size="sm"
                    >
                      Manage Return Details
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 