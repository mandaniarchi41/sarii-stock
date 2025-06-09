import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import SariManagement from './components/SariManagement';
import HistoryPage from './pages/HistoryPage';
import AlertsPage from './components/AlertsPage';
import SariDetailsPage from './components/SariDetailsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertProvider } from './context/AlertContext';
import AlertDisplay from './components/AlertDisplay';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8A2BE2',
    },
    secondary: {
      main: '#FF6347',
    },
    custom: {
      'bharat-dark': '#333333',
      'bharat-gold': '#B8860B',
      'bharat-red': '#A52A2A',
      'bharat-white': '#FFFFFF',
      'bharat-light-gray': '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Open Sans", sans-serif',
    h4: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#E1BEE7',
          color: '#4A148C',
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
  },
});

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-custom-bharat-light-gray text-custom-bharat-dark font-sans">
      <Navbar />
      <AlertDisplay />
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="bg-custom-bharat-white rounded-lg shadow-md p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <SariManagement />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "alerts",
        element: <AlertsPage />,
      },
      {
        path: "sari/:sariId",
        element: <SariDetailsPage />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AlertProvider>
        <RouterProvider router={router} />
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App; 