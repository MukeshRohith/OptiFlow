import React from 'react';
import EmployeeProgress from '../components/EmployeeProgress';
import { useState, useEffect } from 'react';

const Progress = () => {
  const [employees, setEmployees] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    try {
      // Get all localStorage keys and filter out known system keys
      const systemKeys = ['currentUser', 'projects', 'salaryData', 'inventory', 'inventoryRequests', 'authorizedEmails'];
      const users = Object.keys(localStorage)
        .filter(key => !systemKeys.includes(key))
        .map(key => {
          try {
            const data = localStorage.getItem(key);
            if (!data || typeof data !== 'string') return null;
            
            // Skip non-JSON data
            if (data.startsWith('data:') || data.startsWith('<') || data.startsWith('function')) return null;
            
            const parsedData = JSON.parse(data);
            // Validate user object structure
            if (!parsedData || typeof parsedData !== 'object' || !parsedData.username || !parsedData.role) return null;
            
            return parsedData;
          } catch (error) {
            console.error(`Error parsing user data for key ${key}:`, error);
            return null;
          }
        })
        .filter(user => user && user.role === 'employee');
      setEmployees(users);

      let projectsData = [];
      try {
        const projectsStr = localStorage.getItem('projects');
        if (projectsStr && typeof projectsStr === 'string') {
          const parsedProjects = JSON.parse(projectsStr);
          if (Array.isArray(parsedProjects)) {
            // Validate project structure
            projectsData = parsedProjects.filter(project => {
              return project && typeof project === 'object' && Array.isArray(project.tasks);
            });
          }
        }
      } catch (error) {
        console.error('Error parsing projects data:', error);
      }

      const progressData = {};
      
      users.forEach(employee => {
        if (!employee || !employee.username) return;
        
        const employeeTasks = projectsData.flatMap(project => {
          if (!project || !Array.isArray(project.tasks)) return [];
          return project.tasks.filter(task => (
            task && 
            typeof task === 'object' && 
            task.assignedTo === employee.username
          )) || [];
        });
        const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
        const totalTasks = employeeTasks.length;
        progressData[employee.username] = totalTasks > 0 ? completedTasks / totalTasks : 0;
      });
      
      setProgress(progressData);
    } catch (error) {
      console.error('Error calculating progress:', error);
      setProgress({});
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'projects') {
        // Re-fetch progress data when projects are updated
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Employee Progress</h1>
        <EmployeeProgress employees={employees} progress={progress} />
      </div>
    </div>
  );
};

export default Progress;