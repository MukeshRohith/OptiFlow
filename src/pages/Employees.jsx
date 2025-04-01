import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDetails from '../components/EmployeeDetails';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleEmployeeDeleted = () => {
    setSelectedEmployee(null);
    // Refresh the employees list
    const users = Object.keys(localStorage)
      .filter(key => !['currentUser', 'projects', 'salaryData', 'inventory', 'inventoryRequests', 'authorizedEmails'].includes(key))
      .map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.error(`Error parsing user data for key ${key}:`, error);
          return null;
        }
      })
      .filter(user => user && user.role === 'employee');

    setEmployees(users);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);

    if (user.role !== 'admin') {
      navigate('/home');
      return;
    }

    // Load employees
    const users = Object.keys(localStorage)
      .filter(key => !['currentUser', 'projects', 'salaryData', 'inventory', 'inventoryRequests', 'authorizedEmails'].includes(key))
      .map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.error(`Error parsing user data for key ${key}:`, error);
          return null;
        }
      })
      .filter(user => user && user.role === 'employee');

    setEmployees(users);
  }, [navigate]);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Employees</h1>
        
        <div className="flex gap-6">
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Employee List</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {employees.map(employee => (
                  <button
                    key={employee.username}
                    onClick={() => setSelectedEmployee(employee.username)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none ${selectedEmployee === employee.username ? 'bg-gray-50' : ''}`}
                  >
                    <p className="font-medium text-gray-900">{employee.username}</p>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </button>
                ))}
                {employees.length === 0 && (
                  <div className="p-4 text-gray-500">No employees found</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            {selectedEmployee ? (
              <EmployeeDetails 
                username={selectedEmployee} 
                onEmployeeDeleted={handleEmployeeDeleted}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select an employee to view their details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;