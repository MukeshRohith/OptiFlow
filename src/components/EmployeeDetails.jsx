import React, { useState, useEffect } from 'react';

const EmployeeDetails = ({ username, onEmployeeDeleted }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    // Load employee data
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
      .filter(user => user && user.username === username)[0];

    setEmployeeData(users);

    // Load projects data
    const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
    const employeeProjects = projectsData.filter(project => 
      project.employees && project.employees.includes(username)
    );

    setProjects(employeeProjects);

    // Calculate task statistics
    const allTasks = employeeProjects.flatMap(project =>
      project.tasks.filter(task => task.assignedTo === username)
    );

    setTaskStats({
      total: allTasks.length,
      completed: allTasks.filter(task => task.status === 'completed').length
    });
  }, [username]);

  if (!employeeData) {
    return <div className="p-4">Loading...</div>;
  }

  const handleDeleteEmployee = () => {
    // Remove employee data
    localStorage.removeItem(username);

    // Remove salary data
    try {
      const salaryData = JSON.parse(localStorage.getItem('salaryData') || '{}');
      delete salaryData[username];
      localStorage.setItem('salaryData', JSON.stringify(salaryData));
    } catch (error) {
      console.error('Error updating salary data:', error);
    }

    // Remove inventory requests and personal inventory
    try {
      // Remove inventory requests
      const inventoryRequests = JSON.parse(localStorage.getItem('inventoryRequests') || '[]');
      const updatedRequests = inventoryRequests.filter(request => request.requestedBy !== username);
      localStorage.setItem('inventoryRequests', JSON.stringify(updatedRequests));

      // Remove personal inventory
      localStorage.removeItem(`personalInventory_${username}`);
    } catch (error) {
      console.error('Error updating inventory data:', error);
    }

    // Update projects data
    const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
    const updatedProjects = projectsData.map(project => ({
      ...project,
      employees: project.employees.filter(emp => emp !== username),
      tasks: project.tasks.map(task => ({
        ...task,
        assignedTo: task.assignedTo === username ? null : task.assignedTo
      }))
    }));
    localStorage.setItem('projects', JSON.stringify(updatedProjects));

    // Notify parent component
    onEmployeeDeleted();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{employeeData.username}</h2>
          <p className="text-gray-600">{employeeData.email}</p>
          <p className="text-gray-600 capitalize">Role: {employeeData.role}</p>
        </div>
        <button
          onClick={handleDeleteEmployee}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete Employee
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Task Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Completed Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Assigned Projects</h3>
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <p className="text-gray-600 text-sm mt-1">{project.description}</p>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Tasks: {project.tasks.filter(task => task.assignedTo === username).length}
                </p>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-600">No projects assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;