import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import errorHandler from '../src/middleware/errorHandler';

jest.mock('../src/services/castingService', () => ({
  listCastingCalls: jest.fn(),
  getCastingCallById: jest.fn(),
  createCastingCall: jest.fn(),
  updateCastingCall: jest.fn(),
  deleteCastingCall: jest.fn(),
  getApplicationsForCastingCall: jest.fn(),
  closeCastingCall: jest.fn(),
  fillCastingCall: jest.fn(),
}));

jest.mock('../src/middleware/auth', () =>
  jest.fn((req, res, next) => {
    req.user = {
      userId: 'user1',
      email: 'test@test.com',
      role: 'CASTING_DIRECTOR',
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

import * as castingService from '../src/services/castingService';
import castingRoutes from '../src/routes/casting';

const app = express();
app.use(express.json());
app.use('/api/v1/casting-calls', castingRoutes);
app.use(errorHandler);

describe('Casting Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/casting-calls', () => {
    it('should list all open casting calls with pagination', async () => {
      const mockResult = {
        data: [
          {
            id: '1',
            title: 'Test Casting',
            description: 'Test description',
            status: 'OPEN',
            type: 'FILM',
            director: {
              id: 'dir1',
              email: 'director@test.com',
              profile: { firstName: 'John', lastName: 'Doe' },
            },
            _count: { applications: 5 },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      (castingService.listCastingCalls as any).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/v1/casting-calls');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Casting');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter by search query', async () => {
      (castingService.listCastingCalls as any).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      });

      const response = await request(app).get('/api/v1/casting-calls?search=action&sort=budget_high');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/casting-calls/:id', () => {
    it('should get a single casting call by id', async () => {
      const mockCastingCall = {
        id: '1',
        title: 'Test Casting',
        description: 'Test description',
        status: 'OPEN',
        director: { id: 'dir1', email: 'director@test.com' },
        applications: [],
        _count: { applications: 0 },
      };

      (castingService.getCastingCallById as any).mockResolvedValue(mockCastingCall);

      const response = await request(app).get('/api/v1/casting-calls/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 for non-existent casting call', async () => {
      (castingService.getCastingCallById as any).mockRejectedValue(
        Object.assign(new Error('Casting call not found'), { statusCode: 404 })
      );

      const response = await request(app).get('/api/v1/casting-calls/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/casting-calls', () => {
    it('should create a new casting call', async () => {
      const mockCastingCall = {
        id: '1',
        title: 'New Casting',
        description: 'New description',
        type: 'FILM',
        status: 'DRAFT',
        directorId: 'user1',
      };

      (castingService.createCastingCall as any).mockResolvedValue(mockCastingCall);

      const response = await request(app).post('/api/v1/casting-calls').send({
        title: 'New Casting',
        description: 'New description',
        type: 'FILM',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Casting');
    });

    it('should reject invalid casting call data', async () => {
      const response = await request(app).post('/api/v1/casting-calls').send({
        title: '',
        description: 'desc',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/casting-calls/:id', () => {
    it('should update a casting call', async () => {
      const updatedCall = {
        id: '1',
        title: 'Updated Title',
        directorId: 'user1',
      };

      (castingService.updateCastingCall as any).mockResolvedValue(updatedCall);

      const response = await request(app).put('/api/v1/casting-calls/1').send({
        title: 'Updated Title',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for non-owner', async () => {
      (castingService.updateCastingCall as any).mockRejectedValue(
        Object.assign(new Error('You can only update your own casting calls'), { statusCode: 403 })
      );

      const response = await request(app).put('/api/v1/casting-calls/1').send({
        title: 'Updated Title',
      });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/casting-calls/:id', () => {
    it('should delete a casting call', async () => {
      (castingService.deleteCastingCall as any).mockResolvedValue({ id: '1', deleted: true });

      const response = await request(app).delete('/api/v1/casting-calls/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });
  });

  describe('GET /api/v1/casting-calls/:id/applications', () => {
    it('should list applications for a casting call', async () => {
      const mockApplications = [
        {
          id: 'app1',
          status: 'PENDING',
          talent: { id: 'talent1', email: 'talent@test.com', profile: { firstName: 'Jane' } },
        },
      ];

      (castingService.getApplicationsForCastingCall as any).mockResolvedValue(mockApplications);

      const response = await request(app).get('/api/v1/casting-calls/1/applications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/casting-calls/:id/close', () => {
    it('should close a casting call', async () => {
      const mockCastingCall = { id: '1', status: 'CLOSED' };

      (castingService.closeCastingCall as any).mockResolvedValue(mockCastingCall);

      const response = await request(app).post('/api/v1/casting-calls/1/close');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CLOSED');
    });
  });

  describe('POST /api/v1/casting-calls/:id/fill', () => {
    it('should mark a casting call as filled', async () => {
      const mockCastingCall = { id: '1', status: 'FILLED' };

      (castingService.fillCastingCall as any).mockResolvedValue(mockCastingCall);

      const response = await request(app).post('/api/v1/casting-calls/1/fill');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('FILLED');
    });
  });
});
