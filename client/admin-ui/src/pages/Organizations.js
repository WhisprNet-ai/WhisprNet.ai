import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizationAPI } from '../services/api';

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionPlan: 'basic'
  });
  
  // Stats
  const [stats, setStats] = useState({
    activeOrgs: 0,
    totalUsers: 0,
    totalIntegrations: 0,
    totalWhispers: 0
  });

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Function to fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      console.log('Fetching organizations with includeInactive:', includeInactive);
      const response = await organizationAPI.getAll(includeInactive);
      console.log('Organizations response:', response.data);
      
      // Transform data for UI if needed
      const transformedOrgs = response.data.data.map(org => ({
        id: org._id,
        name: org.name,
        contactEmail: org.contactInfo?.email || 'N/A',
        status: org.isActive ? 'active' : 'inactive',
        subscriptionPlan: org.subscription?.plan || 'free',
        createdAt: org.createdAt,
        users: org.memberCount || 0,
        integrations: 0, // Will need to fetch from a different endpoint
        whispers: 0 // Will need to fetch from a different endpoint
      }));
      
      setOrganizations(transformedOrgs);
      
      // Calculate stats
      setStats({
        activeOrgs: transformedOrgs.filter(org => org.status === 'active').length,
        totalUsers: transformedOrgs.reduce((acc, org) => acc + org.users, 0),
        totalIntegrations: transformedOrgs.reduce((acc, org) => acc + org.integrations, 0),
        totalWhispers: transformedOrgs.reduce((acc, org) => acc + org.whispers, 0)
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.response?.data?.error || 'Failed to fetch organizations');
      setLoading(false);
    }
  };

  // Add effect to refetch when includeInactive changes
  useEffect(() => {
    fetchOrganizations();
  }, [includeInactive]);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get badge color based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/50 text-green-300 border border-green-500/50';
      case 'inactive':
        return 'bg-red-900/50 text-red-300 border border-red-500/50';
      case 'pending':
        return 'bg-amber-900/50 text-amber-300 border border-amber-500/50';
      case 'suspended':
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
      default:
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
    }
  };

  // Function to get badge color based on subscription plan
  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-900/50 text-purple-300 border border-purple-500/50';
      case 'professional':
        return 'bg-purple-900/50 text-purple-300 border border-purple-500/50';
      case 'pro':
        return 'bg-blue-900/50 text-blue-300 border border-blue-500/50';
      case 'basic':
        return 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/50';
      case 'free':
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
      default:
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrg({ ...newOrg, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create new organization via API
      const response = await organizationAPI.create(newOrg);
      
      // Refresh organizations
      fetchOrganizations();
      
      // Close modal and reset form
      setShowCreateModal(false);
      setNewOrg({
        name: '',
        contactEmail: '',
        contactPhone: '',
        subscriptionPlan: 'basic'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organization');
    }
  };

  // Suspend organization
  const suspendOrganization = async (id) => {
    try {
      await organizationAPI.update(id, { isActive: false });
      // Refresh organizations
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suspend organization');
    }
  };

  // Activate organization
  const activateOrganization = async (id) => {
    try {
      await organizationAPI.update(id, { isActive: true });
      // Refresh organizations
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate organization');
    }
  };

  // Update the deleteOrganization function to use the modal
  const confirmDelete = (org) => {
    setOrgToDelete(org);
    setShowDeleteModal(true);
  };

  // This function is called when the user confirms deletion in the modal
  const handleDeleteConfirm = async () => {
    if (!orgToDelete) return;
    
    try {
      await organizationAPI.delete(orgToDelete.id);
      
      // If includeInactive is true, update the UI to show the org as inactive
      if (includeInactive) {
        setOrganizations(organizations.map(org => 
          org.id === orgToDelete.id ? { ...org, status: 'inactive' } : org
        ));
        
        // Update stats to reflect the change
        setStats({
          ...stats,
          activeOrgs: stats.activeOrgs - 1
        });
      } else {
        // If not showing inactive orgs, remove it from the array
        setOrganizations(organizations.filter(org => org.id !== orgToDelete.id));
      }
      
      // Close the modal
      setShowDeleteModal(false);
      setOrgToDelete(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete organization');
      setShowDeleteModal(false);
    }
  };

  // Function to view organization details
  const viewOrgDetails = (org) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-300 border border-red-500/50 p-4 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={fetchOrganizations}
          className="mt-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Organizations
          </h1>
          <p className="mt-2 text-gray-400">
            Manage organizations and their subscriptions on the WhisprNet.ai platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="includeInactive" className="mr-3 text-sm text-gray-400">
              Show Inactive
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="includeInactive"
                checked={includeInactive}
                onChange={(e) => {
                  console.log('Toggle changed to:', e.target.checked);
                  setIncludeInactive(e.target.checked);
                }}
                className="sr-only"
              />
              <div 
                className={`block w-10 h-6 rounded-full transition-colors duration-300 ease-in-out ${includeInactive ? 'bg-blue-500' : 'bg-gray-600'}`}
                onClick={() => {
                  console.log('Toggle clicked, current state:', includeInactive);
                  setIncludeInactive(!includeInactive);
                }}
              ></div>
              <div 
                className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300 ease-in-out bg-white transform ${includeInactive ? 'translate-x-4' : ''}`}
                onClick={() => {
                  console.log('Toggle button clicked, current state:', includeInactive);
                  setIncludeInactive(!includeInactive);
                }}
              ></div>
            </div>
          </div>
          <Link
            to="/invitations"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 transition-all duration-200"
          >
            Invite Organization
          </Link>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Organization
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Users
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/30 backdrop-blur-sm divide-y divide-gray-700">
            {organizations.map((org) => (
              <tr 
                key={org.id} 
                className={`hover:bg-gray-700/30 transition-colors duration-150 ${
                  org.status === 'inactive' ? 'opacity-60' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-600/30 text-lg">
                      <span className="text-cyan-400 font-medium">
                        {org.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-200">{org.name}</div>
                      <div className="text-sm text-gray-400">{org.contactEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(org.status)}`}>
                    {org.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPlanBadgeClass(org.subscriptionPlan)}`}>
                    {org.subscriptionPlan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {org.users}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(org.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4"
                    onClick={() => viewOrgDetails(org)}
                  >
                    Details
                  </button>
                  {org.status === 'active' && (
                    <button 
                      className="text-amber-400 hover:text-amber-300 transition-colors mr-4"
                      onClick={() => suspendOrganization(org.id)}
                    >
                      Suspend
                    </button>
                  )}
                  {(org.status === 'inactive' || org.status === 'suspended') && (
                    <button 
                      className="text-green-400 hover:text-green-300 transition-colors mr-4"
                      onClick={() => activateOrganization(org.id)}
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    className="text-red-400 hover:text-red-300 transition-colors"
                    onClick={() => confirmDelete(org)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-purple-900/30 border border-purple-600/30">
              <svg className="h-6 w-6 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20H7C4.79086 20 3 18.2091 3 16V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V16C21 18.2091 19.2091 20 17 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L10 13.5L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Active Organizations</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {stats.activeOrgs}
                </span>
                <span className="ml-2 text-sm text-gray-400">
                  of {organizations.length} total
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-blue-900/30 border border-blue-600/30">
              <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {stats.totalUsers}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-cyan-900/30 border border-cyan-600/30">
              <svg className="h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Total Integrations</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {stats.totalIntegrations}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-emerald-900/30 border border-emerald-600/30">
              <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H16M8 8H16M8 16H12M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Total Whispers</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {stats.totalWhispers}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-gray-800 rounded-xl border border-gray-700 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                        Create New Organization
                      </h3>
                      <div className="mt-2 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={newOrg.name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            name="contactEmail"
                            id="contactEmail"
                            value={newOrg.contactEmail}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-300">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            name="contactPhone"
                            id="contactPhone"
                            value={newOrg.contactPhone}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="subscriptionPlan" className="block text-sm font-medium text-gray-300">
                            Subscription Plan
                          </label>
                          <select
                            id="subscriptionPlan"
                            name="subscriptionPlan"
                            value={newOrg.subscriptionPlan}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-2 px-3 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-gray-200 sm:text-sm"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-base font-medium text-white hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-gray-800 rounded-xl border border-gray-700 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                      Organization Details
                    </h3>
                    
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-600/30 text-lg">
                          <span className="text-cyan-400 font-medium">
                            {selectedOrg.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-200">{selectedOrg.name}</h4>
                          <p className="text-sm text-gray-400">Created {formatDate(selectedOrg.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-sm font-medium text-gray-400">Status</span>
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(selectedOrg.status)}`}>
                          {selectedOrg.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-sm font-medium text-gray-400">Subscription Plan</span>
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getPlanBadgeClass(selectedOrg.subscriptionPlan)}`}>
                          {selectedOrg.subscriptionPlan}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-sm font-medium text-gray-400">Contact Email</span>
                        <span className="text-sm text-gray-300">{selectedOrg.contactEmail}</span>
                      </div>
                      
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-sm font-medium text-gray-400">Total Users</span>
                        <span className="text-sm text-gray-300">{selectedOrg.users}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-base font-medium text-white hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orgToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-gray-800 rounded-xl border border-gray-700 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10 border border-red-500/30">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">
                      Delete Organization
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        Are you sure you want to delete <span className="font-semibold text-red-400">{orgToDelete.name}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-base font-medium text-white hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setOrgToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations; 