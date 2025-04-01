import React from 'react';
import ProjectManagement from '../components/ProjectManagement';

const Home = () => {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Projects & Tasks</h1>
        <ProjectManagement />
      </div>
    </div>
  );
};

export default Home;