import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  Building2,
  Tag,
  CreditCard,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'vendor-data', icon: Users, label: 'Vendor Data' },
    { id: 'customers', icon: UserCheck, label: 'Customers' },
    { id: 'categories', icon: Tag, label: 'Categories' },
    { id: 'subscription-users', icon: CreditCard, label: 'Subscription Users' },
    { id: 'withdrawal-requests', icon: Wallet, label: 'Withdrawal Requests' },
    { id: 'revenue', icon: DollarSign, label: 'My Revenue' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'pnl', icon: TrendingUp, label: 'My PnL' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-sky-600 to-sky-700 text-white transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 border-b border-sky-500">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-lg p-2">
            <Building2 className="text-blue-600 w-6 h-6" />
          </div>
          {isOpen && (
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="font-bold text-lg text-blue-400">Local</span>
                <span className="font-bold text-lg text-orange-400">Zarurat</span>
              </div>
              <p className="text-sky-200 text-sm">Admin Panel</p>
              <p className="text-sky-300 text-xs mt-1">by Cripcocode Technologies</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200 hover:bg-sky-500 ${
                isActive ? 'bg-sky-500 border-r-4 border-white' : ''
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-sky-500 rounded-lg p-4 text-center">
            <p className="text-sm font-medium">Need Help?</p>
            <p className="text-xs text-sky-200 mt-1">Contact support</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;