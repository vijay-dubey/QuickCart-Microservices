import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import { PencilIcon } from '@heroicons/react/24/outline';
import userService, { UserResponse, UserUpdateRequest, Gender } from '../../services/userService';
import { format } from 'date-fns';

export default function UserEditPage() {
  const { email } = useParams<{ email: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dob: ''
  });

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
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
          dob: userData.dob ? userData.dob.substring(0, 10) : ''
        });
      } catch (err) {
        console.error(`Failed to fetch user with email ${email}:`, err);
        setError('Failed to load user. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [email, currentUser, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    if (!email) return;

    try {
      const updateData: UserUpdateRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender as Gender,
        dob: formData.dob
      };

      const updatedUser = await userService.updateUser(email, updateData);
      setUser(updatedUser);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setError(err.message || 'Failed to update user information. Please try again.');
    } finally {
      setIsSaving(false);
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Update user information'}
              </p>
            </div>
            <PencilIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {error && (
            <div className="mx-4 my-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mx-4 my-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              User updated successfully!
            </div>
          )}
          
          <div className="border-t border-gray-200 px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (cannot be changed)
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-400 border border-gray-300 rounded-lg shadow-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition calendar-visible"
                  />
                  <style>
                    {`
                    /* Make the calendar button more visible */
                    input[type="date"]::-webkit-calendar-picker-indicator {
                      background-color: rgba(0, 0, 0, 0.1);
                      padding: 5px;
                      cursor: pointer;
                      border-radius: 3px;
                    }
                    
                    /* Apply these styles to make the calendar more user-friendly */
                    @media screen and (-webkit-min-device-pixel-ratio:0) {
                      input[type="date"]::-webkit-inner-spin-button,
                      input[type="date"]::-webkit-clear-button {
                        height: 20px;
                        width: 20px;
                      }
                    }
                    
                    /* Make the calendar visible and improve scrolling */
                    .calendar-visible::-webkit-calendar-picker-indicator {
                      opacity: 1;
                      display: block;
                      width: 24px;
                      height: 24px;
                      margin-left: 8px;
                    }
                    `}
                  </style>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Created
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Not available'}
                  </div>
                </div>
                
                {user?.deleted && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Account Deleted
                    </label>
                    <div className="w-full px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg">
                      {user?.deletedAt ? formatDate(user.deletedAt) : 'Unknown delete date'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="px-5 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary-dark transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 