import React from 'react';
import { Menu, Bell, Search, User, LogOut, Shield, Crown, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userUtils } from '../utils/userUtils';

interface HeaderProps {
  toggleSidebar: () => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, onLogout, isSidebarOpen }) => {
  const { user } = useAuth();
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* LocalZarurat Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-blue-600">Local</span>
              <span className="text-xl font-bold text-orange-500">Zarurat</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-sm text-gray-600 font-medium">Admin Panel</div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>Developed by</span>
              <span className="font-semibold text-gray-700">Cripcocode Technologies Pvt Ltd</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="bg-sky-500 rounded-full p-2 relative">
            <User className="w-5 h-5 text-white" />
            {userUtils.isSuperAdmin(user) && (
              <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
            )}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              <p className="text-sm font-medium text-gray-700">
                {userUtils.getDisplayName(user)}
              </p>
              {userUtils.isSuperAdmin(user) && (
                <Shield className="w-3 h-3 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500">{user?.email}</p>
              <span className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded-full">
                {userUtils.getRoleDisplayName(user)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;