import React, { useState, useEffect } from 'react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, threshold: 0, unit: '', returnable: false });
  const [requests, setRequests] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState({});
  const [withdrawError, setWithdrawError] = useState({});
  const [returnAmount, setReturnAmount] = useState({});
  const [returnError, setReturnError] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [personalInventory, setPersonalInventory] = useState([]);
  const [personalReturnAmount, setPersonalReturnAmount] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      const storedItems = JSON.parse(localStorage.getItem('inventory') || '[]');
      const storedRequests = JSON.parse(localStorage.getItem('inventoryRequests') || '[]');
      const storedPersonalInventory = JSON.parse(localStorage.getItem(`personalInventory_${user.username}`) || '[]');
      setItems(storedItems);
      setRequests(storedRequests);
      setPersonalInventory(storedPersonalInventory);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }, []);

  const saveToLocalStorage = (items, requests, personalInv) => {
    try {
      if (!currentUser) return;
      localStorage.setItem('inventory', JSON.stringify(items));
      localStorage.setItem('inventoryRequests', JSON.stringify(requests));
      localStorage.setItem(`personalInventory_${currentUser.username}`, JSON.stringify(personalInv || personalInventory));
    } catch (error) {
      console.error('Error saving inventory data:', error);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || newItem.quantity <= 0 || newItem.threshold <= 0 || !newItem.unit) return;

    const updatedItems = [...items, { ...newItem, id: Date.now(), returnable: newItem.returnable }];
    setItems(updatedItems);
    saveToLocalStorage(updatedItems, requests);
    setNewItem({ name: '', quantity: 0, threshold: 0, unit: '', returnable: false });
  };

  const handleReturn = (itemId) => {
    const amount = returnAmount[itemId];
    if (!amount || amount <= 0) {
      setReturnError({ ...returnError, [itemId]: 'Please enter a valid quantity' });
      return;
    }

    const personalItem = personalInventory.find(item => item.mainInventoryId === itemId);
    if (!personalItem || personalItem.quantity < amount) {
      setReturnError({ ...returnError, [itemId]: 'Insufficient quantity in personal inventory' });
      return;
    }

    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, quantity: item.quantity + amount }
        : item
    );

    const updatedPersonalInventory = personalInventory.map(item =>
      item.mainInventoryId === itemId
        ? { ...item, quantity: item.quantity - amount }
        : item
    ).filter(item => item.quantity > 0);

    setItems(updatedItems);
    setPersonalInventory(updatedPersonalInventory);
    saveToLocalStorage(updatedItems, requests, updatedPersonalInventory);
    setReturnAmount({ ...returnAmount, [itemId]: 0 });
    setReturnError({ ...returnError, [itemId]: '' });
  };

  const handleWithdraw = (itemId) => {
    const amount = withdrawAmount[itemId];
    if (!amount || amount <= 0) {
      setWithdrawError({ ...withdrawError, [itemId]: 'Please enter a valid quantity' });
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (amount > item.quantity) {
      setWithdrawError({ ...withdrawError, [itemId]: 'Requested quantity exceeds available stock' });
      return;
    }

    const existingPersonalItem = personalInventory.find(item => item.mainInventoryId === itemId);
    const currentPersonalQuantity = existingPersonalItem ? existingPersonalItem.quantity : 0;
    const newTotalQuantity = currentPersonalQuantity + amount;
    const thresholdMultiple = Math.floor(newTotalQuantity / item.threshold);
    const previousThresholdMultiple = Math.floor(currentPersonalQuantity / item.threshold);

    setWithdrawError({ ...withdrawError, [itemId]: '' });

    if (thresholdMultiple > previousThresholdMultiple) {
      const newRequest = {
        id: Date.now(),
        itemId,
        itemName: item.name,
        requestedBy: currentUser.username,
        requestedQuantity: amount,
        status: 'pending'
      };
      const updatedRequests = [...requests, newRequest];
      setRequests(updatedRequests);
      saveToLocalStorage(items, updatedRequests);
      setWithdrawAmount({ ...withdrawAmount, [itemId]: 0 });
      return;
    } else {
      const today = new Date().toISOString().split('T')[0];
      const withdrawalHistory = JSON.parse(localStorage.getItem(`withdrawalHistory_${currentUser.username}`) || '{}');
      const updatedHistory = {
        ...withdrawalHistory,
        [today]: {
          ...withdrawalHistory[today],
          [itemId]: (withdrawalHistory[today]?.[itemId] || 0) + amount
        }
      };
      localStorage.setItem(`withdrawalHistory_${currentUser.username}`, JSON.stringify(updatedHistory));

      const updatedItems = items.map(item =>
        item.id === itemId
          ? { ...item, quantity: item.quantity - amount }
          : item
      );
      
      const withdrawnItem = items.find(item => item.id === itemId);
      const existingPersonalItem = personalInventory.find(item => item.mainInventoryId === itemId);
      
      let updatedPersonalInventory;
      if (existingPersonalItem) {
        updatedPersonalInventory = personalInventory.map(item =>
          item.mainInventoryId === itemId
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      } else {
        updatedPersonalInventory = [...personalInventory, {
          id: Date.now(),
          mainInventoryId: itemId,
          name: withdrawnItem.name,
          quantity: amount,
          unit: withdrawnItem.unit,
          returnable: withdrawnItem.returnable
        }];
      }
      
      setItems(updatedItems);
      setPersonalInventory(updatedPersonalInventory);
      saveToLocalStorage(updatedItems, requests, updatedPersonalInventory);
      setWithdrawAmount({ ...withdrawAmount, [itemId]: 0 });
    }
  };

  const handleRequest = (requestId, approved) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    let updatedItems = [...items];
    let updatedPersonalInventory = [...personalInventory];

    if (approved) {
      updatedItems = items.map(item =>
        item.id === request.itemId
          ? { ...item, quantity: item.quantity - request.requestedQuantity }
          : item
      );

      const withdrawnItem = items.find(item => item.id === request.itemId);
      const existingPersonalItem = personalInventory.find(item => item.mainInventoryId === request.itemId);
      
      if (existingPersonalItem) {
        updatedPersonalInventory = personalInventory.map(item =>
          item.mainInventoryId === request.itemId
            ? { ...item, quantity: item.quantity + request.requestedQuantity }
            : item
        );
      } else {
        updatedPersonalInventory = [...personalInventory, {
          id: Date.now(),
          mainInventoryId: request.itemId,
          name: withdrawnItem.name,
          quantity: request.requestedQuantity,
          unit: withdrawnItem.unit,
          returnable: withdrawnItem.returnable
        }];
      }

      setItems(updatedItems);
      setPersonalInventory(updatedPersonalInventory);

      const userPersonalInventoryKey = `personalInventory_${request.requestedBy}`;
      const userPersonalInventory = JSON.parse(localStorage.getItem(userPersonalInventoryKey) || '[]');
      let updatedUserPersonalInventory;

      const existingUserItem = userPersonalInventory.find(item => item.mainInventoryId === request.itemId);
      if (existingUserItem) {
        updatedUserPersonalInventory = userPersonalInventory.map(item =>
          item.mainInventoryId === request.itemId
            ? { ...item, quantity: item.quantity + request.requestedQuantity }
            : item
        );
      } else {
        updatedUserPersonalInventory = [...userPersonalInventory, {
          id: Date.now(),
          mainInventoryId: request.itemId,
          name: withdrawnItem.name,
          quantity: request.requestedQuantity,
          unit: withdrawnItem.unit,
          returnable: withdrawnItem.returnable
        }];
      }

      localStorage.setItem(userPersonalInventoryKey, JSON.stringify(updatedUserPersonalInventory));
    }

    const updatedRequests = requests.map(r =>
      r.id === requestId
        ? { ...r, status: approved ? 'approved' : 'rejected' }
        : r
    );

    setRequests(updatedRequests);
    saveToLocalStorage(updatedItems, updatedRequests, updatedPersonalInventory);
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Inventory Management</h2>

      {isAdmin && (
        <div className="mb-8 bg-white p-8 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-xl font-bold mb-6 text-gray-900">Add New Item</h3>
          <form onSubmit={handleAddItem} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200"
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200"
                  placeholder="e.g., pcs, kg, L"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Threshold Quantity</label>
              <input
                type="number"
                value={newItem.threshold}
                onChange={(e) => setNewItem({ ...newItem, threshold: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200"
                placeholder="Enter threshold quantity"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="returnable"
                checked={newItem.returnable}
                onChange={(e) => setNewItem({ ...newItem, returnable: e.target.checked })}
                className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="returnable" className="text-sm font-medium text-gray-700">
                Item is returnable
              </label>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200"
            >
              Add Item
            </button>
          </form>
        </div>
      )}

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Inventory</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-gray-600">Available: {item.quantity} {item.unit}</p>
              <p className="text-gray-600">Threshold: {item.threshold} {item.unit}</p>
              <p className="text-gray-600">Status: {item.returnable ? 'Returnable' : 'Non-returnable'}</p>
              {isAdmin ? (
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => setEditItem(item)}
                    className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const updatedItems = items.filter(i => i.id !== item.id);
                      setItems(updatedItems);
                      saveToLocalStorage(updatedItems, requests);
                    }}
                    className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="space-y-2">
                    <div>
                      <input
                        type="number"
                        value={withdrawAmount[item.id] || ''}
                        onChange={(e) => {
                          setWithdrawAmount({
                            ...withdrawAmount,
                            [item.id]: parseInt(e.target.value) || 0
                          });
                          setWithdrawError({ ...withdrawError, [item.id]: '' });
                        }}
                        className="block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                        placeholder="Amount to withdraw"
                      />
                      {withdrawError[item.id] && (
                        <p className="mt-1 text-sm text-red-600">{withdrawError[item.id]}</p>
                      )}
                    </div>
                    {item.returnable && (
                      <div>
                        <input
                          type="number"
                          value={returnAmount[item.id] || ''}
                          onChange={(e) => {
                            setReturnAmount({
                              ...returnAmount,
                              [item.id]: parseInt(e.target.value) || 0
                            });
                            setReturnError({ ...returnError, [item.id]: '' });
                          }}
                          className="block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                          placeholder="Amount to return"
                        />
                        {returnError[item.id] && (
                          <p className="mt-1 text-sm text-red-600">{returnError[item.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleWithdraw(item.id)}
                      className="mt-2 flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Withdraw
                    </button>
                    {item.returnable && (
                      <button
                        onClick={() => handleReturn(item.id)}
                        className="mt-2 flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Return
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <>
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Your Pending Requests</h3>
            <div className="space-y-4">
              {requests
                .filter(request => request.requestedBy === currentUser.username)
                .map(request => (
                  <div key={request.id} className={`border rounded-lg p-4 ${request.status === 'pending' ? 'bg-yellow-50' : request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{request.itemName}</h4>
                        <p className="text-gray-600">Requested Quantity: {request.requestedQuantity}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}
                      >
                        {request.status === 'pending' ? 'Awaiting Approval' : 
                         request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                ))}
              {requests.filter(request => request.requestedBy === currentUser.username).length === 0 && (
                <p className="text-gray-500 text-center">No pending requests</p>
              )}
            </div>
          </div>

          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Your Personal Inventory</h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {personalInventory.map(item => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-gray-600">Quantity: {item.quantity} {item.unit}</p>
                  {item.returnable && (
                    <div className="mt-4">
                      <input
                        type="number"
                        value={personalReturnAmount[item.mainInventoryId] || ''}
                        onChange={(e) => {
                          setPersonalReturnAmount({
                            ...personalReturnAmount,
                            [item.mainInventoryId]: parseInt(e.target.value) || 0
                          });
                          setReturnError({ ...returnError, [item.mainInventoryId]: '' });
                        }}
                        className="block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                        placeholder="Amount to return"
                      />
                      {returnError[item.mainInventoryId] && (
                        <p className="mt-1 text-sm text-red-600">{returnError[item.mainInventoryId]}</p>
                      )}
                      <button
                        onClick={() => handleReturn(item.mainInventoryId)}
                        className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Return to Main Inventory
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Inventory Requests</h3>
            {requests.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all inventory requests?')) {
                    setRequests([]);
                    saveToLocalStorage(items, []);
                  }
                }}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete All Requests
              </button>
            )}
          </div>
          <div className="space-y-4">
            {requests.map(request => {
              const item = items.find(i => i.id === request.itemId);
              const quantityLeft = item ? item.quantity - request.requestedQuantity : 0;
              const isLowStock = item && quantityLeft < item.threshold;
              
              return (
                <div key={request.id} className={`border rounded-lg p-4 ${request.status === 'pending' ? 'bg-white' : request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="font-medium text-lg">{request.itemName}</p>
                      <p className="text-gray-600">Requested by: <span className="font-medium">{request.requestedBy}</span></p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p>Requested Quantity: <span className="font-medium">{request.requestedQuantity} {item?.unit}</span></p>
                        <p>Current Stock: <span className="font-medium">{item?.quantity || 0} {item?.unit}</span></p>
                        <p>Quantity After Withdrawal: <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>{quantityLeft} {item?.unit}</span></p>
                        <p>Item Threshold: <span className="font-medium">{item?.threshold || 0} {item?.unit}</span></p>
                      </div>
                      {isLowStock && (
                        <p className="text-red-600 text-sm">Warning: Approval will result in stock below threshold</p>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium
                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRequest(request.id, true)}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequest(request.id, false)}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        const updatedRequests = requests.filter(r => r.id !== request.id);
                        setRequests(updatedRequests);
                        saveToLocalStorage(items, updatedRequests);
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Edit Item</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              try {
                if (!editItem.name || editItem.quantity < 0 || editItem.threshold <= 0 || !editItem.unit) {
                  alert('Please fill all required fields with valid values');
                  return;
                }
                const updatedItems = items.map(item =>
                  item.id === editItem.id ? editItem : item
                );
                setItems(updatedItems);
                saveToLocalStorage(updatedItems, requests);
                setEditItem(null);
              } catch (error) {
                console.error('Error updating item:', error);
                alert('Failed to update item. Please try again.');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={editItem.quantity}
                    onChange={(e) => setEditItem({ ...editItem, quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    value={editItem.unit}
                    onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Threshold</label>
                  <input
                    type="number"
                    value={editItem.threshold}
                    onChange={(e) => setEditItem({ ...editItem, threshold: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editReturnable"
                    checked={editItem.returnable}
                    onChange={(e) => setEditItem({ ...editItem, returnable: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editReturnable" className="ml-2 block text-sm text-gray-900">
                    Item is returnable
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;