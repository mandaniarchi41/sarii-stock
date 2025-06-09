import React, { useState, useEffect } from 'react';
import { Warning as WarningIcon } from '@mui/icons-material';

const AlertsPage = () => {
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/saris');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const saris = await response.json();
      const alerts = [];

      saris.forEach(sari => {
        sari.colors.forEach(color => {
          if (color.minStock !== undefined && color.stock < color.minStock) {
            alerts.push({
              id: `${sari._id}-${color.color}`,
              sariName: sari.name,
              sariNumber: sari.sariNumber,
              color: color.color,
              currentStock: color.stock,
              minimumStock: color.minStock,
            });
          }
        });
      });
      setLowStockAlerts(alerts);
    } catch (error) {
      console.error('Error loading saris for alerts:', error);
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Set up polling every 30 seconds
    const pollInterval = setInterval(fetchAlerts, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="space-y-8 bg-custom-bharat-white text-custom-bharat-dark font-sans">
      {/* Low Stock Alerts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-custom-bharat-dark font-serif">Low Stock Alerts</h2>
          <div className="text-sm text-custom-bharat-dark font-sans">
            {lowStockAlerts.length} {lowStockAlerts.length === 1 ? 'item' : 'items'} below minimum stock
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-custom-bharat-dark font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-bharat-gold mx-auto"></div>
            <p className="text-custom-bharat-dark mt-2">Loading alerts...</p>
          </div>
        ) : lowStockAlerts.length === 0 ? (
          <div className="text-center py-8 bg-custom-bharat-light-gray rounded-lg text-custom-bharat-dark font-sans">
            <p className="text-custom-bharat-dark">All items are well stocked!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm text-custom-bharat-dark font-sans"
              >
                <div className="flex items-start">
                  <WarningIcon className="text-custom-bharat-red mt-1 mr-3" />
                  <div className="flex-1">
                    <h3 className="font-medium text-custom-bharat-dark font-sans">
                      {alert.sariName} (Sari No: {alert.sariNumber})
                    </h3>
                    <p className="text-custom-bharat-dark mt-1">
                      Color: {alert.color} - Current Stock ({alert.currentStock}) is below Minimum Stock ({alert.minimumStock})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage; 