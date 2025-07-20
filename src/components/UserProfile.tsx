import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userUtils } from '../utils/userUtils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Crown, 
  Wallet, 
  Star, 
  Store, 
  CheckCircle, 
  XCircle,
  Calendar,
  Settings,
  CreditCard,
  Heart
} from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-500">No user data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-6">
      {/* Basic Information */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <User className="w-6 h-6 mr-2" />
          User Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-sky-500 rounded-full p-3">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {userUtils.getDisplayName(user)}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  {userUtils.isEmailVerified(user) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.phone}</span>
                {userUtils.isPhoneVerified(user) && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {userUtils.getCountry(user)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Last Login: {userUtils.formatLastLogin(user)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userUtils.isActive(user) 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {userUtils.isActive(user) ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <div className="flex items-center space-x-1">
                {userUtils.isSuperAdmin(user) && <Crown className="w-4 h-4 text-yellow-500" />}
                <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                  {userUtils.getRoleDisplayName(user)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Access Level:</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {userUtils.getAccessLevel(user)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Details */}
      {userUtils.getAdminDetails(user) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Admin Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {userUtils.getPermissions(user).map((permission, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Super Admin:</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userUtils.isSuperAdmin(user)
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {userUtils.isSuperAdmin(user) ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Details */}
      {userUtils.getVendorDetails(user) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Store className="w-5 h-5 mr-2" />
            Vendor Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                ₹{userUtils.getWalletBalance(user).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Rating</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {userUtils.getAverageRating(user).toFixed(1)} ⭐
              </p>
              <p className="text-xs text-gray-500">
                {userUtils.getTotalRatings(user)} reviews
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Subscription</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userUtils.getSubscriptionStatus(user) === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {userUtils.getSubscriptionStatus(user)}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">KYC Status</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userUtils.isKYCVerified(user)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {userUtils.isKYCVerified(user) ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Store className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Shop Status</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userUtils.isShopListed(user)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {userUtils.isShopListed(user) ? 'Listed' : 'Not Listed'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details */}
      {userUtils.getCustomerDetails(user) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Customer Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Favorite Categories:</p>
              <div className="flex flex-wrap gap-2">
                {user.customerDetails?.preferences?.categories && user.customerDetails.preferences.categories.length > 0 ? (
                  user.customerDetails.preferences.categories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No favorite categories</span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Favorites:</p>
              <span className="text-sm text-gray-600">
                {user.customerDetails?.favorites?.length || 0} items
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">User ID:</p>
            <p className="font-mono text-gray-800">{user._id}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Created:</p>
            <p className="text-gray-800">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">Last Updated:</p>
            <p className="text-gray-800">
              {new Date(user.updatedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">Login Attempts:</p>
            <p className="text-gray-800">{user.loginAttempts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 