import React from 'react';
import FinancialManagement from '../components/FinancialManagement';

const Financial = () => {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Financial Management</h1>
        <FinancialManagement />
      </div>
    </div>
  );
};

export default Financial;