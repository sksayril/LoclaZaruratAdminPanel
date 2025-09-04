import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import DashboardHome from './pages/DashboardHome';
import VendorData from './pages/VendorData';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import SubscriptionUsers from './pages/SubscriptionUsers';
import WithdrawalRequests from './pages/WithdrawalRequests';
import SuperEmployee from './pages/SuperEmployee';
import Revenue from './pages/Revenue';
import Reports from './pages/Reports';
import PnL from './pages/PnL';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'vendor-data':
        return <VendorData />;
      case 'customers':
        return <Customers />;
      case 'categories':
        return <Categories />;
      case 'subscription-users':
        return <SubscriptionUsers />;
      case 'withdrawal-requests':
        return <WithdrawalRequests />;
      case 'super-employee':
        return <SuperEmployee />;
      case 'revenue':
        return <Revenue />;
      case 'reports':
        return <Reports />;
      case 'pnl':
        return <PnL />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header
          toggleSidebar={toggleSidebar}
          onLogout={onLogout}
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className="p-6 h-screen overflow-y-auto pb-32">
          {renderCurrentPage()}
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;