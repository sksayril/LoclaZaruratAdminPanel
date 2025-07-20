import React from 'react';
import { Building2, Star, Shield, Award } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* LocalZarurat Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-blue-600">Local</span>
                <span className="text-lg font-bold text-orange-500">Zarurat</span>
              </div>
            </div>
            <span className="text-gray-500 text-sm">Admin Panel</span>
          </div>

          {/* Company Information */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Innovation</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4 text-purple-500" />
              <span>Excellence</span>
            </div>
          </div>

          {/* Developer Information */}
          <div className="text-center md:text-right">
            <div className="text-sm text-gray-600">
              Developed by{' '}
              <span className="font-semibold text-gray-800">Cripcocode Technologies Pvt Ltd</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              © 2024 All rights reserved
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 