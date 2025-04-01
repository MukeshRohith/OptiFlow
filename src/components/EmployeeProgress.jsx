import React, { useState } from 'react';
import { useEffect } from 'react';

const EmployeeProgress = ({ employees = [], progress = {} }) => {
  const [isProgressExpanded, setIsProgressExpanded] = useState({});

  useEffect(() => {
    if (!Array.isArray(employees)) return;
    
    setIsProgressExpanded(prevState => {
      const newState = {};
      employees.forEach(employee => {
        if (employee?.username) {
          newState[employee.username] = prevState[employee.username] ?? false;
        }
      });
      return newState;
    });
  }, [employees]);

  const toggleProgress = (username) => {
    setIsProgressExpanded(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  return (
    <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Employee Progress</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track employee task completion and performance
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(employees) && employees.map(employee => {
            const employeeProgress = progress[employee.username] || 0;
            const progressPercentage = (employeeProgress * 100).toFixed(1);
            
            return (
              <div 
                key={employee.username} 
                className="bg-gray-50 rounded-lg p-6 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md"
                onClick={() => toggleProgress(employee.username)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{employee.username}</h4>
                  <span className="text-sm font-medium text-indigo-600">{progressPercentage}%</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Task Completion Rate
                </div>
                {isProgressExpanded[employee.username] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Click to view detailed progress information
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProgress;