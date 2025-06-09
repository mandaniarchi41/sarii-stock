import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';

const Navbar = () => {
  const location = useLocation();
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchLowStockCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/saris');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const saris = await response.json();
      let count = 0;

      if (Array.isArray(saris)) {
        saris.forEach(sari => {
          sari.colors.forEach(color => {
            if (color.minStock !== undefined && color.stock < color.minStock) {
              count++;
            }
          });
        });
      } else {
        console.warn('API returned non-array data for low stock count:', saris);
      }
      setLowStockCount(count);
    } catch (error) {
      console.error('Error fetching low stock count:', error);
    }
  };

  useEffect(() => {
    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-custom-bharat-dark shadow-lg font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <StorefrontIcon className="h-8 w-8 text-custom-bharat-white" />
            <Link to="/" className="ml-2 text-custom-bharat-white text-xl font-bold hover:text-custom-bharat-gold transition-colors duration-200">
              KPcreation
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium text-custom-bharat-white transition-colors duration-200 ${
                isActive('/')
                  ? 'bg-custom-bharat-gold text-custom-bharat-dark'
                  : 'hover:text-custom-bharat-gold'
              }`}
            >
              <StorefrontIcon className="h-5 w-5 mr-1" />
              Inventory
            </Link>
            <Link
              to="/history"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium text-custom-bharat-white transition-colors duration-200 ${
                isActive('/history')
                  ? 'bg-custom-bharat-gold text-custom-bharat-dark'
                  : 'hover:text-custom-bharat-gold'
              }`}
            >
              <HistoryIcon className="h-5 w-5 mr-1" />
              History
            </Link>
            <Link
              to="/alerts"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium text-custom-bharat-white transition-colors duration-200 relative ${
                isActive('/alerts')
                  ? 'bg-custom-bharat-gold text-custom-bharat-dark'
                  : 'hover:text-custom-bharat-gold'
              }`}
            >
              <WarningIcon className="h-5 w-5 mr-1 text-custom-bharat-white" />
              Alerts
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-custom-bharat-red text-custom-bharat-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {lowStockCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 