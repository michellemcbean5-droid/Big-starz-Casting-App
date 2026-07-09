import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import errorHandler from '../src/middleware/errorHandler';

jest.mock('../src/services/applicationService', () => ({
  submitApplication: jest.fn(),
  listApplications: jest.fn(),
  getApplicationById: jest.fn(),
  updateApplicationStatus: jest.fn(),
  withdrawApplication: jest.fn(),
}));

jest.mock('../src/middleware/auth', () =>
  jest.fn((req, res, next) => {
    req.user = {
      userId: 'user1',
      email: 'test@test.com',
      role: 'TALENT',
    };
    next();
  })
);

jest.mock('../src/middleware/roleCheck', () => ({
  requireCastingDirector: jest.fn((req, res, next) => next()),
  requireTalent: jest.fn((req, res, next) => next()),
  requireAdmin: jest.fn((req, res, next) => next()),
  requireCreator: jest.fn((req, res, next) => next()),
  requireRoles: jest.fn(() => (req, res, next) => next()),
}));

import * as applicationService from '../src/services/applicationService';
import applicationRoutes from '../src/routes/applications';

const app = express();
app.use(express.json());
app.use('/api/v1/applications', applicationRoutes);
app.use(errorHandler);

describe('Application Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/applications', () => {
    it('should submit a new application', async () => {
      const mockApplication = {
        id: 'app1',
        talentId: 'user1',
        castingCallId: 'call1',
        status: 'PENDING',
        coverLetter: 'I am interested',
        castingCall: { id: 'call1', title: 'Test Casting' },
        talent: { id: 'user1', email: 'test@test.com' },
      };

      (applicationService.submitApplication as any).mockResolvedValue(mockApplication);

      const response = await request(app).post('/api/v1/applications').send({
        castingCallId: 'call1',
        coverLetter: 'I am interested',
        videoUrl: 'https://example.com/video.mp4',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should reject application without castingCallId', async () => {
      const response = await request(app).post('/api/v1/applications').send({
        coverLetter: 'I am interested',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject application to closed casting call', async () => {
      (applicationService.submitApplication as any).mockRejectedValue(
        Object.assign(new Error('This casting call is no longer accepting applications'), { statusCode: 400 })
      );

      const response = await request(app).post('/api/v1/applications').send({
        castingCallId: 'call1',
        coverLetter: 'I am interested',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate application', async () => {
      (applicationService.submitApplication as any).mockRejectedValue(
        Object.assign(new Error('You have already applied to this casting call'), { statusCode: 409 })
      );

      const response = await request(app).post('/api/v1/applications').send({
        castingCallId: 'call1',
        coverLetter: 'I am interested',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/applications', () => {
    it('should list applications for talent', async () => {
      const mockApplications = [
        {
          id: 'app1',
          status: 'PENDING',
          castingCall: { id: 'call1', title: 'Test Casting', status: 'OPEN' },
          talent: { id: 'user1', email: 'test@test.com' },
        },
      ];

      (applicationService.listApplications as any).mockResolvedValue(mockApplications);

      const response = await request(app).get('/api/v1/applications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/applications/:id', () => {
    it('should get application detail', async () => {
      const mockApplication = {
        id: 'app1',
        talentId: 'user1',
        status: 'PENDING',
        castingCall: { id: 'call1', title: 'Test Casting', directorId: 'dir1' },
        talent: { id: 'user1', email: 'test@test.com' },
      };

      (applicationService.getApplicationById as any).mockResolvedValue(mockApplication);

      const response = await request(app).get('/api/v1/applications/app1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('app1');
    });
  });

  describe('PUT /api/v1/applications/:id/status', () => {
    it('should update application status to REVIEWING', async () => {
      const updatedApp = {
        id: 'app1',
        status: 'REVIEWING',
        castingCall: { id: 'call1', title: 'Test Casting' },
        talent: { id: 'user2', email: 'talent@test.com' },
      };

      (applicationService.updateApplicationStatus as any).mockResolvedValue(updatedApp);

      const response = await request(app).put('/api/v1/applications/app1/status').send({
        status: 'REVIEWING',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REVIEWING');
    });

    it('should reject invalid status transition', async () => {
      (applicationService.updateApplicationStatus as any).mockRejectedValue(
        Object.assign(new Error('Invalid status transition from REJECTED to HIRED'), { statusCode: 400 })
      );

      const response = await request(app).put('/api/v1/applications/app1/status').send({
        status: 'HIRED',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/applications/:id', () => {
    it('should withdraw pending application', async () => {
      (applicationService.withdrawApplication as any).mockResolvedValue({ id: 'app1', withdrawn: true });

      const response = await request(app).delete('/api/v1/applications/app1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawn).toBe(true);
    });

    it('should reject withdrawal of non-pending application', async () => {
      (applicationService.withdrawApplication as any).mockRejectedValue(
        Object.assign(new Error('Cannot withdraw application with status REVIEWING'), { statusCode: 400 })
      );

      const response = await request(app).delete('/api/v1/applications/app1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
