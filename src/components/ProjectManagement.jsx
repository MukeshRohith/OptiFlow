import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    employees: [],
    files: [],
    tasks: []
  });
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    id: '',
    title: '',
    description: '',
    assignedTo: '',
    status: 'pending',
    submissions: [],
    priority: 'medium',
    dueDate: '',
    approvalStatus: 'pending'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    try {
      // Load and validate projects from localStorage
      const projectsStr = localStorage.getItem('projects');
      let storedProjects = [];
      if (projectsStr && typeof projectsStr === 'string') {
        const parsedProjects = JSON.parse(projectsStr);
        if (Array.isArray(parsedProjects)) {
          storedProjects = parsedProjects.filter(project => (
            project && 
            typeof project === 'object' && 
            typeof project.name === 'string' && 
            Array.isArray(project.tasks)
          ));
        }
      }
      setProjects(storedProjects);

      // Load and validate available employees
      const systemKeys = ['currentUser', 'projects', 'salaryData', 'inventory', 'inventoryRequests'];
      const users = Object.keys(localStorage)
        .filter(key => !systemKeys.includes(key))
        .map(key => {
          try {
            const data = localStorage.getItem(key);
            if (!data || typeof data !== 'string') return null;
            const parsed = JSON.parse(data);
            return parsed && 
              typeof parsed === 'object' && 
              parsed.role === 'employee' && 
              parsed.username ? parsed : null;
          } catch (error) {
            console.error(`Error parsing employee data for key ${key}:`, error);
            return null;
          }
        })
        .filter(Boolean);
      setAvailableEmployees(users);
    } catch (error) {
      console.error('Error loading project data:', error);
      setProjects([]);
      setAvailableEmployees([]);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
      setHasUnsavedChanges(false);
    }
  }, [projects]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    const projectWithId = { 
      ...newProject, 
      id: Date.now(),
      tasks: []
    };
    // Add the new project to the projects array
    setProjects([...projects, projectWithId]);
    setHasUnsavedChanges(true);
    // Reset form and close modal
    setNewProject({ name: '', description: '', employees: [], files: [] });
    setShowModal(false);
  };

  const handleEditProject = (e) => {
    e.preventDefault();
    const updatedProjects = projects.map(project =>
      project.id === editingProject.id ? { ...editingProject } : project
    );
    setProjects(updatedProjects);
    setHasUnsavedChanges(true);
    setEditingProject(null);
    setShowEditModal(false);
  };

  const handleFileUpload = (e, projectId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result,
        uploadDate: new Date().toISOString(),
        downloadUrl: event.target.result
      };

      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            files: [...(project.files || []), fileData]
          };
        }
        return project;
      });

      setProjects(updatedProjects);
      setHasUnsavedChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEmployeeChange = (username) => {
    setNewProject(prev => {
      const employees = prev.employees.includes(username)
        ? prev.employees.filter(emp => emp !== username)
        : [...prev.employees, username];
      return { ...prev, employees };
    });
  };

  const updateEmployeePerformance = (employee, progress) => {
    // Load current salary data
    const salaryData = JSON.parse(localStorage.getItem('salaryData') || '{}');
    
    // Calculate performance increase based on progress
    const performanceIncrease = progress >= 100 ? 0.2 : // 20% increase for 100% completion
                               progress >= 75 ? 0.15 : // 15% increase for 75% completion
                               progress >= 50 ? 0.1 : // 10% increase for 50% completion
                               progress >= 25 ? 0.05 : // 5% increase for 25% completion
                               0; // No increase for less than 25% completion

    // Update salary data with new performance increase
    const updatedSalaryData = {
      ...salaryData,
      [employee]: {
        ...salaryData[employee],
        performanceIncrease
      }
    };

    // Save updated salary data
    localStorage.setItem('salaryData', JSON.stringify(updatedSalaryData));
  };

  // Filter projects based on user role
  const filteredProjects = isAdmin
    ? projects
    : projects.filter(project => project.employees.includes(currentUser ?.username));

  return (
    <div className="mt-10">
      {isAdmin && (
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 border-2 border-indigo-600 rounded-lg shadow-lg text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200"
          >
            <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
            Create Project
          </button>
          {hasUnsavedChanges && (
            <button
              onClick={() => {
                localStorage.setItem('projects', JSON.stringify(projects));
                setHasUnsavedChanges(false);
              }}
              className="inline-flex items-center px-6 py-3 border-2 border-green-600 rounded-lg shadow-lg text-base font-semibold text-white bg-green-600 hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Project List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProjects.map((project) => (
            <li key={project.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <div className="flex items-center space-x-4">
                      {project.employees.map(employee => {
                        const employeeTasks = project.tasks?.filter(task => task.assignedTo === employee) || [];
                        const completedTasks = employeeTasks.filter(task => {
                          return task.status === 'completed' && task.submissions?.every(s => s.status === 'approved');
                        });
                        const progress = employeeTasks.length > 0 ? (completedTasks.length / employeeTasks.length) * 100 : 0;
                        
                        // Update employee performance and salary based on progress
                        updateEmployeePerformance(employee, progress);
                        
                        return (
                          <div key={employee} className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">{employee}</span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 ml-1">{Math.round(progress)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setShowTaskModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
                    >
                      Add Task
                    </button>
                  )}
                  <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                  {/* Tasks Section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks</h4>
                    <div className="space-y-4">
                      {project.tasks?.filter(task => isAdmin || task.assignedTo === currentUser?.username).map((task) => (
                        <div key={task.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="text-sm font-medium text-gray-900">{task.title}</h5>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Assigned to: {task.assignedTo}</span>
                                {isAdmin && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setNewTask(task);
                                        setShowTaskModal(true);
                                      }}
                                      className="text-xs text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updatedProjects = projects.map(p => {
                                          if (p.id === project.id) {
                                            return {
                                              ...p,
                                              tasks: p.tasks.filter(t => t.id !== task.id)
                                            };
                                          }
                                          return p;
                                        });
                                        setProjects(updatedProjects);
                                        localStorage.setItem('projects', JSON.stringify(updatedProjects));
                                      }}
                                      className="text-xs text-red-600 hover:text-red-900"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{task.description}</p>
                              <div className="mt-2 flex items-center space-x-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' : task.submissions?.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {task.status === 'completed' ? 'Completed' : task.submissions?.length > 0 ? 'Submitted' : 'Pending'}
                              </span>
                              {!isAdmin && task.status !== 'completed' && (
                                <div className="mt-2">
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;

                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const submission = {
                                          name: file.name,
                                          type: file.type,
                                          size: file.size,
                                          data: event.target.result,
                                          submittedAt: new Date().toISOString(),
                                          status: 'pending'
                                        };

                                        const updatedProjects = projects.map(p => {
                                          if (p.id === project.id) {
                                            const updatedTasks = p.tasks.map(t => {
                                              if (t.id === task.id) {
                                                return {
                                                  ...t,
                                                  submissions: [...(t.submissions || []), submission]
                                                };
                                              }
                                              return t;
                                            });
                                            return { ...p, tasks: updatedTasks };
                                          }
                                          return p;
                                        });

                                        setProjects(updatedProjects);
                                        setHasUnsavedChanges(true);
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                  />
                                </div>
                              )}
                              {task.submissions?.length > 0 && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : task.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {task.approvalStatus === 'approved' ? 'Approved' : task.approvalStatus === 'rejected' ? 'Rejected' : 'Awaiting Review'}
                                </span>
                              )}
                              {task.submissions?.length > 0 && isAdmin && (
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={() => {
                                      const latestSubmission = task.submissions[task.submissions.length - 1];
                                      window.open(latestSubmission.data, '_blank');
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                  >
                                    Download All Files
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {task.submissions?.length > 0 && (
                            <div className="mt-3">
                              <h6 className="text-xs font-medium text-gray-700 mb-2">Submissions</h6>
                              <ul className="space-y-2">
                                {task.submissions.map((submission, index) => (
                                  <li key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-600">{submission.name}</span>
                                      <span className="text-xs text-gray-500">{new Date(submission.submittedAt).toLocaleString()}</span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${submission.status === 'approved' ? 'bg-green-100 text-green-800' : submission.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {submission.status}
                                      </span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => window.open(submission.data, '_blank')}
                                        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                      >
                                        View
                                      </button>
                                      <a
                                        href={submission.data}
                                        download={submission.name}
                                        className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                                      >
                                        Download
                                      </a>
                                      {isAdmin && submission.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              const updatedProjects = projects.map(p => {
                                                if (p.id === project.id) {
                                                  const updatedTasks = p.tasks.map(t => {
                                                    if (t.id === task.id) {
                                                      const updatedSubmissions = t.submissions.map((s, i) => {
                                                        if (i === index) {
                                                          return { ...s, status: 'approved', reviewedAt: new Date().toISOString() };
                                                        }
                                                        return s;
                                                      });
                                                      
                                                      // Check if all submissions are approved
                                                      const allSubmissionsApproved = updatedSubmissions.every(s => s.status === 'approved');
                                                      
                                                      return {
                                                        ...t,
                                                        status: allSubmissionsApproved ? 'completed' : 'pending',
                                                        approvalStatus: allSubmissionsApproved ? 'approved' : 'pending',
                                                        completedAt: allSubmissionsApproved ? new Date().toISOString() : null,
                                                        submissions: updatedSubmissions
                                                      };
                                                    }
                                                    return t;
                                                  });
                                                  return { ...p, tasks: updatedTasks };
                                                }
                                                return p;
                                              });
                                              setProjects(updatedProjects);
                                              setHasUnsavedChanges(true);
                                            }}
                                            className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => {
                                              const updatedProjects = projects.map(p => {
                                                if (p.id === project.id) {
                                                  const updatedTasks = p.tasks.map(t => {
                                                    if (t.id === task.id) {
                                                      const updatedSubmissions = t.submissions.map((s, i) => {
                                                        if (i === index) {
                                                          return { ...s, status: 'rejected', reviewedAt: new Date().toISOString() };
                                                        }
                                                        return s;
                                                      });
                                                      return {
                                                        ...t,
                                                        approvalStatus: 'rejected',
                                                        submissions: updatedSubmissions
                                                      };
                                                    }
                                                    return t;
                                                  });
                                                  return { ...p, tasks: updatedTasks };
                                                }
                                                return p;
                                              });
                                              setProjects(updatedProjects);
                                              setHasUnsavedChanges(true);
                                            }}
                                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Files Section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Project Files</h4>
                    <ul className="mt-2 space-y-2">
                      {project.files?.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-gray-800">{file.name}</span>
                            <span className="ml-2 text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                          </div>
                          <a
                            href={file.downloadUrl}
                            download={file.name}
                            className="ml-4 inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Download
                          </a>
                        </li>
                      ))}                      
                    </ul>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const updatedProjects = projects.filter(p => p.id !== project.id);
                        setProjects(updatedProjects);
                        localStorage.setItem('projects', JSON.stringify(updatedProjects));
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditProject}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                      type="text"
                      name="edit-name"
                      id="edit-name"
                      value={editingProject?.name || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="edit-description"
                      id="edit-description"
                      value={editingProject?.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      rows="3"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    ></textarea>
                  </div>
                  {isAdmin && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Assign Employees</label>
                        <div className="mt-2 space-y-2">
                          {availableEmployees.map((employee) => (
                            <div key={employee.username} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`edit-employee-${employee.username}`}
                                checked={editingProject?.employees?.includes(employee.username)}
                                onChange={() => {
                                  const employees = editingProject.employees.includes(employee.username)
                                    ? editingProject.employees.filter(emp => emp !== employee.username)
                                    : [...editingProject.employees, employee.username];
                                  setEditingProject({ ...editingProject, employees });
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`edit-employee-${employee.username}`}
                                className="ml-2 block text-sm text-gray-900"
                              >
                                {employee.username}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Upload Files</label>
                        <div className="mt-2">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, editingProject.id)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>
                        {editingProject.files && editingProject.files.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700">Project Files:</h4>
                            <ul className="mt-2 divide-y divide-gray-200">
                              {editingProject.files.map((file, index) => (
                                <li key={index} className="py-2 flex justify-between items-center">
                                  <span className="text-sm text-gray-900">{file.name}</span>
                                  <div className="flex space-x-4">
                                    <a
                                      href={file.downloadUrl}
                                      download={file.name}
                                      className="text-sm text-indigo-600 hover:text-indigo-900"
                                    >
                                      Download
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProject(prev => ({
                                          ...prev,
                                          files: prev.files.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      className="text-sm text-red-600 hover:text-red-900"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setShowEditModal(false);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={(e) => {
                e.preventDefault();
                const isEditing = newTask.id !== '';
                const taskId = isEditing ? newTask.id : Date.now();
                const taskWithDefaults = {
                  ...newTask,
                  id: taskId,
                  status: isEditing ? newTask.status : 'pending',
                  approvalStatus: isEditing ? newTask.approvalStatus : 'pending',
                  submissions: isEditing ? newTask.submissions : [],
                  createdAt: isEditing ? newTask.createdAt : new Date().toISOString(),
                  requiresFile: true
                };
                const updatedProjects = projects.map(p => {
                  if (p.id === editingProject.id) {
                    const updatedTasks = isEditing
                      ? p.tasks.map(t => t.id === taskId ? taskWithDefaults : t)
                      : [...(p.tasks || []), taskWithDefaults];
                    return {
                      ...p,
                      tasks: updatedTasks
                    };
                  }
                  return p;
                });
                setProjects(updatedProjects);
                localStorage.setItem('projects', JSON.stringify(updatedProjects));
                setHasUnsavedChanges(false);
                setNewTask({
                  id: '',
                  title: '',
                  description: '',
                  assignedTo: '',
                  status: 'pending',
                  submissions: [],
                  priority: 'medium',
                  dueDate: '',
                  approvalStatus: 'pending'
                });
                setShowTaskModal(false);
                setEditingProject(null);
              }}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">Task Title</label>
                    <input
                      type="text"
                      id="task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="task-description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      rows="3"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700">Assign To</label>
                    <select
                      id="task-assignee"
                      value={newTask.assignedTo}
                      onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select an employee</option>
                      {editingProject?.employees.map((username) => (
                        <option key={username} value={username}>{username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      id="task-priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      id="task-due-date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {newTask.id ? 'Save Changes' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskModal(false);
                      setEditingProject(null);
                      setNewTask({
                        id: '',
                        title: '',
                        description: '',
                        assignedTo: '',
                        status: 'pending',
                        submissions: [],
                        priority: 'medium',
                        dueDate: '',
                        approvalStatus: 'pending'
                      });
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateProject}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      rows="3"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm bg-white border-2 border-gray-300 rounded-md hover:border-indigo-400 transition-colors duration-200"
                      required
                    ></textarea>
                  </div>
                  {isAdmin && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Assign Employees</label>
                        <div className="mt-2 space-y-2">
                          {availableEmployees.map((employee) => (
                            <div key={employee.username} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`employee-${employee.username}`}
                                checked={newProject.employees.includes(employee.username)}
                                onChange={() => handleEmployeeChange(employee.username)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`employee-${employee.username}`}
                                className="ml-2 block text-sm text-gray-900"
                              >
                                {employee.username}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Upload Files</label>
                        <div className="mt-2">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const fileData = {
                                  name: file.name,
                                  type: file.type,
                                  size: file.size,
                                  data: event.target.result,
                                  uploadDate: new Date().toISOString(),
                                  downloadUrl: event.target.result
                                };
                                setNewProject(prev => ({
                                  ...prev,
                                  files: [...(prev.files || []), fileData]
                                }));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>
                        {newProject.files && newProject.files.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                            <ul className="mt-2 divide-y divide-gray-200">
                              {newProject.files.map((file, index) => (
                                <li key={index} className="py-2 flex justify-between items-center">
                                  <span className="text-sm text-gray-900">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewProject(prev => ({
                                        ...prev,
                                        files: prev.files.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="text-sm text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;