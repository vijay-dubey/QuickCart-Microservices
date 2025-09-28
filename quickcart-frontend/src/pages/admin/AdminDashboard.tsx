import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon, 
  ArrowPathIcon,
  UsersIcon,
  ShoppingCartIcon 
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading] = useState(false);

  // Redirect if user is not an admin
  if (user?.role !== 'ADMIN') {
    navigate('/');
    return null;
  }

  const adminFeatures = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products from the catalog',
      icon: <ShoppingBagIcon className="h-10 w-10 text-primary" />,
      action: () => navigate('/admin/products'),
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: <UsersIcon className="h-10 w-10 text-primary" />,
      action: () => navigate('/admin/users'),
    },
    {
      title: 'Manage Orders',
      description: 'View and update order status',
      icon: <ClipboardDocumentListIcon className="h-10 w-10 text-primary" />,
      action: () => navigate('/admin/orders'),
    },
    {
      title: 'Return Requests',
      description: 'Manage customer return requests',
      icon: <ShoppingCartIcon className="h-10 w-10 text-primary" />,
      action: () => navigate('/admin/returns'),
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isLoading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome, {user?.firstName}!</h2>
          <p className="text-gray-600">
            This is your admin control panel. From here you can manage all aspects of the QuickCart store.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="flex flex-col items-center text-center">
                {feature.icon}
                <h3 className="text-lg font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 