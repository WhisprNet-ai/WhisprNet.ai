import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Organization from '../models/Organization.js';

// Mock email sending
jest.mock('../utils/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Invitation System', () => {
  let adminToken;
  let orgAdminToken;
  let testOrg;
  let adminUser;
  let orgAdminUser;

  // Setup test data before running tests
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/whisprnet_test');
    
    // Clear test collections
    await User.deleteMany({});
    await Invitation.deleteMany({});
    await Organization.deleteMany({});
    
    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization',
      domain: 'test.com'
    });
    
    // Create admin user
    adminUser = await User.create({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123',
      role: 'super_admin'
    });
    
    // Create org admin user
    orgAdminUser = await User.create({
      email: 'orgadmin@test.com',
      firstName: 'Org',
      lastName: 'Admin',
      password: 'password123',
      role: 'org_admin',
      organizationId: testOrg._id
    });
    
    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
    
    orgAdminToken = jwt.sign(
      { id: orgAdminUser._id, role: orgAdminUser.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // Clean up and disconnect
    await User.deleteMany({});
    await Invitation.deleteMany({});
    await Organization.deleteMany({});
    await mongoose.connection.close();
  });
  
  // Test creating an invitation
  describe('POST /api/invitations', () => {
    it('should create a team manager invitation', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          email: 'manager@test.com',
          role: 'team_manager',
          allowedIntegrations: ['slack', 'github']
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('manager@test.com');
      expect(res.body.data.role).toBe('team_manager');
    });
    
    it('should create an org admin invitation', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          email: 'newadmin@test.com',
          role: 'org_admin'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newadmin@test.com');
      expect(res.body.data.role).toBe('org_admin');
    });
  });
  
  // Test accepting an invitation
  describe('GET /api/invitations/accept/:token', () => {
    let invitationToken;
    
    beforeEach(async () => {
      // Create a test invitation
      const invitation = await Invitation.create({
        email: 'test@accept.com',
        role: 'team_manager',
        organizationId: testOrg._id,
        allowedIntegrations: ['slack'],
        createdBy: orgAdminUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Generate token
      invitationToken = jwt.sign(
        { id: invitation._id },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '7d' }
      );
    });
    
    it('should validate an invitation token', async () => {
      const res = await request(app)
        .get(`/api/invitations/accept/${invitationToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@accept.com');
      expect(res.body.data.role).toBe('team_manager');
      expect(res.body.data.organizationName).toBe('Test Organization');
    });
  });
  
  // Test registering from an invitation
  describe('POST /api/invitations/register/:token', () => {
    let invitationToken;
    let invitation;
    
    beforeEach(async () => {
      // Create a test invitation
      invitation = await Invitation.create({
        email: 'register@test.com',
        role: 'team_manager',
        organizationId: testOrg._id,
        allowedIntegrations: ['slack', 'github'],
        createdBy: orgAdminUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Generate token
      invitationToken = jwt.sign(
        { id: invitation._id },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '7d' }
      );
    });
    
    it('should register a new user from an invitation', async () => {
      const res = await request(app)
        .post(`/api/invitations/register/${invitationToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Manager',
          password: 'StrongP@ssw0rd'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.email).toBe('register@test.com');
      expect(res.body.data.role).toBe('team_manager');
      expect(res.body.data.firstName).toBe('Test');
      expect(res.body.data.lastName).toBe('Manager');
      
      // Check that the invitation status is updated
      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation.status).toBe('accepted');
    });
    
    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post(`/api/invitations/register/${invitationToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Manager',
          password: 'weak'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
  
  // Test resending an invitation
  describe('POST /api/invitations/:id/resend', () => {
    let invitation;
    
    beforeEach(async () => {
      // Create a test invitation
      invitation = await Invitation.create({
        email: 'resend@test.com',
        role: 'org_admin',
        organizationId: testOrg._id,
        createdBy: orgAdminUser._id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
      });
    });
    
    it('should resend an expired invitation', async () => {
      const res = await request(app)
        .post(`/api/invitations/${invitation._id}/resend`)
        .set('Authorization', `Bearer ${orgAdminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Check that the invitation expiration is updated
      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation.expiresAt).toBeInstanceOf(Date);
      expect(updatedInvitation.expiresAt > new Date()).toBe(true);
      
      // Check that history is updated
      expect(updatedInvitation.history.length).toBeGreaterThan(0);
      expect(updatedInvitation.history[updatedInvitation.history.length - 1].action).toBe('resent');
    });
  });
}); 