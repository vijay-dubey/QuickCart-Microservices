import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import { UserIcon } from '@heroicons/react/24/outline';
import userService, { UserResponse } from '../../services/userService';
import { format } from 'date-fns';

export default function UserViewPage() {
  const { email } = useParams<{ email: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if user is not an admin
    if (currentUser?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchUser = async () => {
      if (!email) return;
      
      setIsLoading(true);
      try {
        const userData = await userService.getUserByEmail(email);
        setUser(userData);
      } catch (err) {
        console.error(`Failed to fetch user with email ${email}:`, err);
        setError('Failed to load user. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [email, currentUser, navigate]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
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
      
      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="w-full sm:w-[70%] bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'User information'}
              </p>
            </div>
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {error && (
            <div className="mx-4 my-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="border-t border-gray-200 divide-y divide-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.firstName} {user?.lastName}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.email}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.phone}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.gender ? 
                    user.gender === 'PREFER_NOT_TO_SAY' ? 'Prefer not to say' : 
                    user.gender.charAt(0) + user.gender.slice(1).toLowerCase() : 
                    'Not provided'}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.dob ? formatDate(user.dob) : 'Not provided'}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2 text-right">
                  {user?.deleted ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Deleted on {user?.deletedAt ? formatDate(user.deletedAt) : 'Unknown date'}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={() => navigate(`/admin/users/${email}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 