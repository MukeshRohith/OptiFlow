import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectManagement from './ProjectManagement';
import FinancialManagement from './FinancialManagement';

const Welcome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('No user found in localStorage, redirecting to login');
        navigate('/login');
        return;
      }
      const parsedUser = JSON.parse(currentUser);
      console.log('User loaded successfully:', parsedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto py-12 px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to OptiFlow
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Hello, {user.username}! You are logged in as {user.role}.
          </p>
        </div>

        {user.role === 'admin' ? (
          <div className="mt-10">
            <div className="rounded-lg bg-white shadow px-8 py-8 sm:px-10">
              <h2 className="text-lg font-medium text-gray-900">Admin Dashboard</h2>
              <p className="mt-1 text-sm text-gray-500">
                You have access to all administrative features.
              </p>
              <ProjectManagement />
              <FinancialManagement />
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <div className="rounded-lg bg-white shadow px-8 py-8 sm:px-10">
              <h2 className="text-lg font-medium text-gray-900">Employee Dashboard</h2>
              <p className="mt-1 text-sm text-gray-500">
                Welcome to your workspace. You can manage your tasks and resources here.
              </p>
              <ProjectManagement />
              <FinancialManagement />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;