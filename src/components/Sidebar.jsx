import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, CurrencyDollarIcon, ChartBarIcon, ClipboardDocumentListIcon, EnvelopeIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);



  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    }
  }, [navigate]);
  const isAdmin = currentUser?.role === 'admin';

  const navigationItems = [
    { name: 'Home', path: '/home', icon: HomeIcon },
    { name: 'Financial Management', path: '/financial', icon: CurrencyDollarIcon },
    { name: 'Inventory', path: '/inventory', icon: ClipboardDocumentListIcon },
    { name: 'Employee Progress', path: '/progress', icon: ChartBarIcon },
    ...(isAdmin ? [
      { name: 'Employees', path: '/employees', icon: UsersIcon },
      { name: 'Authorized Emails', path: '/authorized-emails', icon: EnvelopeIcon }
    ] : [])
  ];

  return (
    <>
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-800">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white">OptiFlow</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`${isActive(item.path)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
              >
                <item.icon
                  className={`${isActive(item.path)
                    ? 'text-gray-300'
                    : 'text-gray-400 group-hover:text-gray-300'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-700">
          {currentUser && (
            <>
              <button
                onClick={() => setShowProfileModal(true)}
                className="mb-4 p-3 bg-gray-700 rounded-lg w-full hover:bg-gray-600 transition-colors duration-200"
              >
                <div className="flex flex-col space-y-1 text-left">
                  <span className="text-sm font-medium text-white">{currentUser.username}</span>
                  <span className="text-xs text-gray-400 capitalize">{currentUser.role}</span>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    {/* Profile Modal */}
    {showProfileModal && currentUser && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">


            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-gray-50">
                  {currentUser.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-gray-50">
                  {currentUser.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-gray-50 capitalize">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Sidebar;