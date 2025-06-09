import React from 'react';
import { useAlert } from '../context/AlertContext';
import { X as CloseIcon, CheckCircleOutline as SuccessIcon, ErrorOutline as ErrorIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';

const AlertDisplay = () => {
  const { alerts, removeAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-sm w-full">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto p-4 rounded-lg shadow-lg flex items-start space-x-4 opacity-0 transform transition-all duration-300 ease-out translate-x-full ${alerts.length > 0 ? 'opacity-100 translate-x-0' : ''} ${
            alert.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : alert.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {alert.type === 'success' && <SuccessIcon className="h-5 w-5" />}
            {alert.type === 'error' && <ErrorIcon className="h-5 w-5" />}
            {alert.type === 'info' && <InfoIcon className="h-5 w-5" />}
          </div>
          <span className="flex-1 text-sm font-medium">{alert.message}</span>
          <button
            onClick={() => removeAlert(alert.id)}
            className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertDisplay; 