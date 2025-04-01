import React, { useState, useEffect } from 'react';

const AuthorizedEmails = () => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const storedEmails = JSON.parse(localStorage.getItem('authorizedEmails') || '[]');
    setEmails(storedEmails);
  }, []);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!newEmail) {
      setError('Please enter an email address');
      return;
    }

    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(newEmail)) {
      setError('This email is already authorized');
      return;
    }

    const updatedEmails = [...emails, newEmail];
    setEmails(updatedEmails);
    localStorage.setItem('authorizedEmails', JSON.stringify(updatedEmails));
    setNewEmail('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    const updatedEmails = emails.filter(email => email !== emailToRemove);
    setEmails(updatedEmails);
    localStorage.setItem('authorizedEmails', JSON.stringify(updatedEmails));
  };

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Authorized Emails</h2>
      
      <form onSubmit={handleAddEmail} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter employee email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Email
          </button>
        </div>
      </form>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {emails.map((email, index) => (
            <li key={index} className="px-4 py-4 flex justify-between items-center">
              <span className="text-gray-900">{email}</span>
              <button
                onClick={() => handleRemoveEmail(email)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {emails.length === 0 && (
          <p className="p-4 text-gray-500">No authorized emails added yet.</p>
        )}
      </div>
    </div>
  );
};

export default AuthorizedEmails;