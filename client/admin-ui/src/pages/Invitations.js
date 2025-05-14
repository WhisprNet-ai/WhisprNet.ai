import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invitationAPI, organizationAPI } from '../services/api';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    organizationName: '',
    domain: '',
    adminRole: 'admin'
  });

  // Fetch invitations on component mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Function to fetch invitations from API
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationAPI.getAll();
      setInvitations(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.response?.data?.error || 'Failed to fetch invitations');
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get badge color based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-900/50 text-amber-300 border border-amber-500/50';
      case 'accepted':
        return 'bg-green-900/50 text-green-300 border border-green-500/50';
      case 'expired':
        return 'bg-red-900/50 text-red-300 border border-red-500/50';
      case 'cancelled':
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
      default:
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
    }
  };

  // Function to handle form changes
  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setNewInvite({
      ...newInvite,
      [name]: value
    });
  };

  // Function to submit invitation
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await invitationAPI.createOrganizationInvite(newInvite);
      
      // Refresh invitations
      await fetchInvitations();
      
      // Reset form and close modal
      setNewInvite({
        email: '',
        organizationName: '',
        domain: '',
        adminRole: 'admin'
      });
      setShowInviteModal(false);
    } catch (err) {
      console.error('Error sending organization invitation:', err);
      setError(err.response?.data?.error || 'Failed to send organization invitation');
    } finally {
      setLoading(false);
    }
  };

  // Function to resend invitation
  const handleResendInvite = async (id) => {
    try {
      setLoading(true);
      await invitationAPI.resend(id);
      await fetchInvitations();
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.response?.data?.error || 'Failed to resend invitation');
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel invitation
  const handleCancelInvite = async (id) => {
    try {
      setLoading(true);
      await invitationAPI.cancel(id);
      await fetchInvitations();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError(err.response?.data?.error || 'Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading && invitations.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && invitations.length === 0) {
    return (
      <div className="bg-red-900/50 text-red-300 border border-red-500/50 p-4 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={fetchInvitations}
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
            Organization Invitations
          </h1>
          <p className="mt-2 text-gray-400">
            Invite and onboard new organizations to the WhisprNet.ai platform
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 transition-all duration-200"
        >
          Invite New Organization
        </button>
      </div>

      {/* Invitations Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Organization
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Admin Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Expires
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/30 backdrop-blur-sm divide-y divide-gray-700">
            {invitations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                  No organization invitations sent yet. Use the "Invite New Organization" button to invite an organization.
                </td>
              </tr>
            ) : (
              invitations.map((invitation) => (
                <tr key={invitation._id} className="hover:bg-gray-700/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-200">
                          {invitation.organizationName || (invitation.organizationId?.name || "New Organization")}
                        </div>
                        {invitation.domain && (
                          <div className="text-xs text-gray-400">{invitation.domain}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{invitation.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(invitation.status)}`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(invitation.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {invitation.status === 'accepted' 
                      ? <span className="text-green-400">Accepted</span>
                      : formatDate(invitation.expiresAt)
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {invitation.status === 'pending' && (
                      <button 
                        className="text-red-400 hover:text-red-300 transition-colors mr-4"
                        onClick={() => handleCancelInvite(invitation._id)}
                      >
                        Cancel
                      </button>
                    )}
                    {(invitation.status === 'expired' || invitation.status === 'cancelled') && (
                      <button 
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        onClick={() => handleResendInvite(invitation._id)}
                      >
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-amber-900/30 border border-amber-600/30">
              <svg className="h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V12M12 12V15M12 12H15M12 12H9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Pending Invitations</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {invitations.filter(inv => inv.status === 'pending').length}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-green-900/30 border border-green-600/30">
              <svg className="h-6 w-6 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Accepted Invitations</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {invitations.filter(inv => inv.status === 'accepted').length}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-purple-900/30 border border-purple-600/30">
              <svg className="h-6 w-6 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20H7C4.79086 20 3 18.2091 3 16V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V16C21 18.2091 19.2091 20 17 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L10 13.5L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-400">Total Organizations</p>
              <p className="flex items-baseline">
                <span className="text-2xl font-semibold text-gray-200">
                  {invitations.length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75" onClick={() => setShowInviteModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-700"
              role="dialog" 
              aria-modal="true" 
              aria-labelledby="modal-headline"
            >
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 
                    className="text-2xl leading-6 font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" 
                    id="modal-headline"
                  >
                    Invite New Organization
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      Send an invitation email to onboard a new organization to WhisprNet.ai
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInviteSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-400">Organization Name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="organizationName"
                      id="organizationName"
                      required
                      value={newInvite.organizationName}
                      onChange={handleInviteChange}
                      className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-700 bg-gray-900/50 rounded-md p-2"
                      placeholder="Acme Corporation"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-400">Organization Domain (optional)</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="domain"
                      id="domain"
                      value={newInvite.domain}
                      onChange={handleInviteChange}
                      className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-700 bg-gray-900/50 rounded-md p-2"
                      placeholder="acme.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400">Admin Email Address</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={newInvite.email}
                      onChange={handleInviteChange}
                      className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-700 bg-gray-900/50 rounded-md p-2"
                      placeholder="admin@example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">This email will receive the organization invitation as the admin.</p>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-base font-medium text-white hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:col-start-2 sm:text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowInviteModal(false)}
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

export default Invitations; 