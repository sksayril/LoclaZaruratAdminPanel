import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart, 
  PieChart, 
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Star,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play
} from 'lucide-react';

const Reports: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const features = [
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Real-time data visualization with interactive charts and graphs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: PieChart,
      title: 'Custom Reports',
      description: 'Generate personalized reports with drag-and-drop interface',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Performance Metrics',
      description: 'Track KPIs and business performance indicators',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Users,
      title: 'User Insights',
      description: 'Deep dive into user behavior and engagement patterns',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const upcomingFeatures = [
    'Real-time Dashboard Analytics',
    'Custom Report Builder',
    'Automated Report Scheduling',
    'Data Export in Multiple Formats',
    'Advanced Filtering Options',
    'Collaborative Report Sharing',
    'Mobile Report Viewer',
    'API Integration Support'
  ];

  const stats = [
    { label: 'Report Types', value: '15+', icon: FileText },
    { label: 'Export Formats', value: '8', icon: Download },
    { label: 'Real-time Updates', value: '24/7', icon: Clock },
    { label: 'Data Sources', value: '50+', icon: Zap }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              Powerful insights and comprehensive analytics platform coming soon
            </p>
            <div className="flex items-center justify-center space-x-2 text-sky-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Revolutionizing Data Analytics</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Coming Soon Badge */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg animate-bounce">
            🚀 Coming Soon
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What's Coming
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentFeature;
              
              return (
                <div
                  key={index}
                  className={`relative p-6 rounded-2xl transition-all duration-500 transform ${
                    isActive 
                      ? 'scale-105 bg-gradient-to-br ' + feature.color + ' text-white shadow-2xl' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:scale-102'
                  } ${isAnimating && isActive ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gradient-to-r ' + feature.color + ' text-white'
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-2">
                    {feature.title}
                  </h3>
                  <p className={`text-center text-sm ${
                    isActive ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                  
                  {isActive && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Play className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/20">
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Upcoming Features */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Upcoming Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-12">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Be the First to Know
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Get notified when our powerful analytics platform launches
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full sm:w-80 px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30 pr-12"
                />
                <button className="absolute right-2 top-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white p-2 rounded-full hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="text-sm opacity-75 mt-4">
              We'll notify you as soon as the platform is ready
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">
            Development in Progress
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Powered by Cripcocode Technologies Pvt Ltd</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;