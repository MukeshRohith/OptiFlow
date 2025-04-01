import React, { useState, useEffect } from 'react';
import EmployeeProgress from './EmployeeProgress';

const FinancialManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState({});
  const [progress, setProgress] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    try {
      // Load current user
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        throw new Error('No user found. Please log in again.');
      }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Load employees and their salary data
      const users = Object.keys(localStorage)
        .filter(key => key !== 'currentUser' && key !== 'projects' && key !== 'salaryData')
        .map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch (e) {
            console.error(`Error parsing user data for key ${key}:`, e);
            return null;
          }
        })
        .filter(user => user && user.role === 'employee');
      setEmployees(users);

    // Load salary data
    const storedSalaryData = JSON.parse(localStorage.getItem('salaryData') || '{}');
    setSalaryData(storedSalaryData);

    // Load progress data from projects
    const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
    const employeeProgress = {};
    
    users.forEach(employee => {
      const employeeTasks = projectsData.flatMap(project => 
        project.tasks.filter(task => task.assignedTo === employee.username)
      );
      const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
      const totalTasks = employeeTasks.length;
      employeeProgress[employee.username] = totalTasks > 0 ? completedTasks / totalTasks : 0;
    });
    
    setProgress(employeeProgress);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Save salary data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(salaryData).length > 0) {
      localStorage.setItem('salaryData', JSON.stringify(salaryData));
    }
  }, [salaryData]);

  const handleBaseSalaryChange = (username, baseSalary) => {
    setSalaryData(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        baseSalary: parseFloat(baseSalary) || 0
      }
    }));
  };

  const handleMaxSalaryChange = (username, maxSalary) => {
    setSalaryData(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        maxSalary: parseFloat(maxSalary) || 0
      }
    }));
  };

  const calculateTotalSalary = (baseSalary, maxSalary, employeeProgress) => {
    return baseSalary + (employeeProgress * (maxSalary - baseSalary));
  };

  if (isLoading) {
    return (
      <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <p className="text-gray-500">Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <p className="text-red-500">Please log in to view financial information.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Salary Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {salaryData[currentUser.username] ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Base Salary</p>
                <p className="mt-1 text-lg text-gray-900">
                  ${salaryData[currentUser.username].baseSalary.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Max Salary</p>
                <p className="mt-1 text-lg text-gray-900">
                  ${salaryData[currentUser.username].maxSalary.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="mt-1 text-lg text-gray-900">
                  {(progress[currentUser.username] * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Salary</p>
                <p className="mt-1 text-lg text-green-600">
                  ${calculateTotalSalary(
                    salaryData[currentUser.username].baseSalary,
                    salaryData[currentUser.username].maxSalary,
                    progress[currentUser.username]
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No salary information available</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Management</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage employee salaries and performance-based increases
          </p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
          {employees.map(employee => {
            const employeeData = salaryData[employee.username] || { baseSalary: 0, maxSalary: 0 };
            const employeeProgress = progress[employee.username] || 0;
            
            // Calculate total salary based on progress
            const totalSalary = calculateTotalSalary(
              employeeData.baseSalary,
              employeeData.maxSalary,
              employeeProgress
            );

            return (
              <li key={employee.username} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{employee.username}</h4>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`baseSalary-${employee.username}`} className="block text-sm font-medium text-gray-700">
                          Base Salary ($)
                        </label>
                        <input
                          type="number"
                          id={`baseSalary-${employee.username}`}
                          value={employeeData.baseSalary}
                          onChange={(e) => handleBaseSalaryChange(employee.username, e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={`maxSalary-${employee.username}`} className="block text-sm font-medium text-gray-700">
                          Max Salary ($)
                        </label>
                        <input
                          type="number"
                          id={`maxSalary-${employee.username}`}
                          value={employeeData.maxSalary}
                          onChange={(e) => handleMaxSalaryChange(employee.username, e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Total Salary</p>
                      <p className="mt-1 text-lg text-green-600">
                        ${totalSalary.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    <EmployeeProgress employees={employees} progress={progress} />
  </div>
  );
};

export default FinancialManagement;