// Swap createBrowserRouter -> createHashRouter if Capacitor file-protocol
// routing breaks. That is a one-line change here.
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import LogView from './views/LogView';
import PlanView from './views/PlanView';
import ProgressionView from './views/ProgressionView';
import ProfileView from './views/ProfileView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/log" replace /> },
      { path: 'log', element: <LogView /> },
      { path: 'plan', element: <PlanView /> },
      { path: 'progression', element: <ProgressionView /> },
      { path: 'profile', element: <ProfileView /> },
      { path: '*', element: <Navigate to="/log" replace /> },
    ],
  },
]);
