// @ts-nocheck
import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/server';

// Mock the aiService to avoid spawning actual pipelines
jest.mock('../../src/services/aiService', () => ({
  generateScene: jest.fn(),
  generateReel: jest.fn(),
  generateMusicVideo: jest.fn(),
  generateDigitalTwin: jest.fn(),
  autoEnhance: jest.fn(),
  watermark: jest.fn(),
  safetyCheck: jest.fn(),
  autoEdit: jest.fn(),
}));

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
    },
    aiGeneration: {
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    digitalTwin: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contract: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';
import * as aiService from '../../src/services/aiService';

const mockPrisma = prisma as any;
const mockAiService = aiService as any;

function generateTestToken(userId: string, role: string = 'TALENT'): string {
  return jwt.sign(
    { userId, email: 'test@example.com', role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AI Routes', () => {
  const testUserId = 'user-test-123';
  const testToken = generateTestToken(testUserId, 'TALENT');

  beforeEach(() => {
    // Mock user exists
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });

    // Mock subscription (Silver tier)
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-123',
      userId: testUserId,
      tier: 'SILVER',
      status: 'ACTIVE',
    });

    // Mock monthly usage count (0 used)
    (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(0);
  });

  describe('POST /api/v1/ai/generate/scene', () => {
    it('should generate a scene successfully', async () => {
      const mockGenerationId = 'gen-scene-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'SCENE',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.generateScene.mockResolvedValue({
        id: 'scene-abc',
        script: 'Test script content',
        dialogue: 'Test dialogue',
        imageUrls: ['/output/scene_1.png', '/output/scene_2.png'],
      });

      const res = await request(app)
        .post('/api/v1/ai/generate/scene')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          description: 'A detective interrogates a suspect',
          genre: 'thriller',
          characterName: 'Detective Miller',
          emotion: 'tense',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generationId).toBe(mockGenerationId);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.script).toBe('Test script content');
      expect(res.body.data.sceneImages).toEqual(['/output/scene_1.png', '/output/scene_2.png']);
      expect(res.body.data.creditsUsed).toBe(1);
      expect(mockAiService.generateScene).toHaveBeenCalled();
    });

    it('should reject invalid request body', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate/scene')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          description: '',
          genre: 'thriller',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/ai/generate/reel', () => {
    it('should generate a reel successfully', async () => {
      const mockGenerationId = 'gen-reel-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'REEL',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.generateReel.mockResolvedValue({
        videoPath: '/output/reel_test.mp4',
      });

      const res = await request(app)
        .post('/api/v1/ai/generate/reel')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          talentName: 'Jane Doe',
          skills: ['acting', 'singing', 'dance'],
          clips: ['./clip1.mp4', './clip2.jpg'],
          style: 'cinematic',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reelUrl).toBe('/output/reel_test.mp4');
      expect(mockAiService.generateReel).toHaveBeenCalledWith(
        expect.objectContaining({
          talentName: 'Jane Doe',
          skills: ['acting', 'singing', 'dance'],
          clips: ['./clip1.mp4', './clip2.jpg'],
          style: 'cinematic',
        })
      );
    });
  });

  describe('POST /api/v1/ai/generate/music-video', () => {
    it('should generate a music video successfully', async () => {
      const mockGenerationId = 'gen-mv-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'MUSIC_VIDEO',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.generateMusicVideo.mockResolvedValue({
        videoPath: '/output/music_video_abc.mp4',
      });

      const res = await request(app)
        .post('/api/v1/ai/generate/music-video')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          audioFile: './song.mp3',
          visualStyle: 'cyberpunk neon',
          sceneDescriptions: ['city skyline', 'flying through clouds'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.videoUrl).toBe('/output/music_video_abc.mp4');
      expect(mockAiService.generateMusicVideo).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/ai/generate/digital-twin', () => {
    it('should generate a digital twin with consent', async () => {
      const mockGenerationId = 'gen-twin-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'DIGITAL_TWIN',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      (mockPrisma.contract.findFirst as jest.Mock).mockResolvedValue({
        id: 'contract-123',
        userId: testUserId,
        type: 'AI_CONSENT',
        status: 'SIGNED',
      });

      (mockPrisma.digitalTwin.create as jest.Mock).mockResolvedValue({
        id: 'twin-123',
        talentId: testUserId,
      });

      mockAiService.generateDigitalTwin.mockResolvedValue({
        twinId: 'twin-abc',
        modelData: { poses: 5 },
        generatedImages: [],
      });

      const res = await request(app)
        .post('/api/v1/ai/generate/digital-twin')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          referencePhotos: ['https://example.com/photo1.jpg'],
          description: 'Young actor with dark hair',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.twinData).toBeDefined();
      expect(mockAiService.generateDigitalTwin).toHaveBeenCalled();
    });

    it('should reject without AI consent', async () => {
      (mockPrisma.contract.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/ai/generate/digital-twin')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          referencePhotos: ['https://example.com/photo1.jpg'],
          description: 'Young actor with dark hair',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/ai/enhance', () => {
    it('should auto-enhance media', async () => {
      const mockGenerationId = 'gen-enh-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'ENHANCEMENT',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.autoEnhance.mockResolvedValue({
        outputPath: '/output/enhanced_image.png',
      });

      const res = await request(app)
        .post('/api/v1/ai/enhance')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          fileUrl: 'https://example.com/photo.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.enhancedUrl).toBe('/output/enhanced_image.png');
      expect(mockAiService.autoEnhance).toHaveBeenCalledWith({ filePath: 'https://example.com/photo.jpg' });
    });
  });

  describe('POST /api/v1/ai/watermark', () => {
    it('should watermark media', async () => {
      const mockGenerationId = 'gen-wm-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'ENHANCEMENT',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.watermark.mockResolvedValue({
        outputPath: '/output/watermarked_image.png',
      });

      const res = await request(app)
        .post('/api/v1/ai/watermark')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          fileUrl: 'https://example.com/photo.jpg',
          watermarkText: 'AI Generated by Big Starz',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.watermarkedUrl).toBe('/output/watermarked_image.png');
      expect(mockAiService.watermark).toHaveBeenCalledWith(
        expect.objectContaining({
          filePath: 'https://example.com/photo.jpg',
          text: 'AI Generated by Big Starz',
        })
      );
    });
  });

  describe('POST /api/v1/ai/safety-check', () => {
    it('should check text content safety', async () => {
      mockAiService.safetyCheck.mockResolvedValue({
        safe: true,
        flags: [],
        confidence: 0.1,
      });

      const res = await request(app)
        .post('/api/v1/ai/safety-check')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: 'This is a safe text description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.safe).toBe(true);
      expect(res.body.data.flags).toEqual([]);
      expect(mockAiService.safetyCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'This is a safe text description',
          type: 'text',
        })
      );
    });

    it('should check image URL safety', async () => {
      mockAiService.safetyCheck.mockResolvedValue({
        safe: false,
        flags: ['nsfw'],
        confidence: 0.85,
      });

      const res = await request(app)
        .post('/api/v1/ai/safety-check')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: 'https://example.com/image.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.safe).toBe(false);
      expect(res.body.data.flags).toContain('nsfw');
      expect(mockAiService.safetyCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'https://example.com/image.png',
          type: 'image',
        })
      );
    });
  });

  describe('POST /api/v1/ai/auto-edit', () => {
    it('should auto-edit video', async () => {
      const mockGenerationId = 'gen-edit-123';
      (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        userId: testUserId,
        type: 'ENHANCEMENT',
        status: 'PROCESSING',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: mockGenerationId,
        status: 'COMPLETED',
      });

      mockAiService.autoEdit.mockResolvedValue({
        outputPath: '/output/auto_edited_abc.mp4',
      });

      const res = await request(app)
        .post('/api/v1/ai/auto-edit')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          fileUrl: 'https://example.com/raw.mp4',
          targetDuration: 60,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.editedUrl).toBe('/output/auto_edited_abc.mp4');
      expect(mockAiService.autoEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          filePath: 'https://example.com/raw.mp4',
          targetDuration: 60,
        })
      );
    });
  });

  describe('Authentication checks', () => {
    it('should reject requests without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate/scene')
        .send({
          description: 'Test',
          genre: 'drama',
          characterName: 'Test',
          emotion: 'happy',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('AI History Routes', () => {
  const testUserId = 'user-test-456';
  const testToken = generateTestToken(testUserId);

  beforeEach(() => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });
  });

  describe('GET /api/v1/ai/generations', () => {
    it('should list generation history', async () => {
      (mockPrisma.aiGeneration.findMany as jest.Mock).mockResolvedValue([
        { id: 'gen-1', type: 'SCENE', status: 'COMPLETED' },
        { id: 'gen-2', type: 'REEL', status: 'COMPLETED' },
      ]);

      (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/ai/generations')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.generations).toHaveLength(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by type', async () => {
      (mockPrisma.aiGeneration.findMany as jest.Mock).mockResolvedValue([
        { id: 'gen-1', type: 'SCENE', status: 'COMPLETED' },
      ]);
      (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/ai/generations?type=SCENE')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.generations).toHaveLength(1);
    });
  });

  describe('GET /api/v1/ai/generations/:id', () => {
    it('should get a single generation', async () => {
      (mockPrisma.aiGeneration.findFirst as jest.Mock).mockResolvedValue({
        id: 'gen-1',
        type: 'SCENE',
        status: 'COMPLETED',
      });

      const res = await request(app)
        .get('/api/v1/ai/generations/gen-1')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('gen-1');
    });

    it('should return 404 for non-existent generation', async () => {
      (mockPrisma.aiGeneration.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/ai/generations/nonexistent')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/ai/generations/:id', () => {
    it('should soft-delete a generation', async () => {
      (mockPrisma.aiGeneration.findFirst as jest.Mock).mockResolvedValue({
        id: 'gen-1',
        userId: testUserId,
        status: 'COMPLETED',
      });

      (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
        id: 'gen-1',
        status: 'FAILED',
      });

      const res = await request(app)
        .delete('/api/v1/ai/generations/gen-1')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });
});

describe('Credits Routes', () => {
  const testUserId = 'user-test-789';
  const testToken = generateTestToken(testUserId);

  beforeEach(() => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });
  });

  describe('GET /api/v1/credits', () => {
    it('should return current credit balance', async () => {
      (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        tier: 'BRONZE',
        status: 'ACTIVE',
      });

      (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(5);

      const res = await request(app)
        .get('/api/v1/credits')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('BRONZE');
      expect(res.body.data.monthlyLimit).toBe(25);
      expect(res.body.data.usedThisMonth).toBe(5);
      expect(res.body.data.remaining).toBe(20);
    });
  });

  describe('GET /api/v1/credits/usage', () => {
    it('should return monthly usage history', async () => {
      (mockPrisma.aiGeneration.findMany as jest.Mock).mockResolvedValue([
        { type: 'SCENE', costCredits: 1, createdAt: new Date() },
        { type: 'REEL', costCredits: 1, createdAt: new Date() },
      ]);

      const res = await request(app)
        .get('/api/v1/credits/usage')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('GET /api/v1/credits/tiers', () => {
    it('should return tier pricing without auth', async () => {
      const res = await request(app).get('/api/v1/credits/tiers');

      expect(res.status).toBe(200);
      expect(res.body.data.tiers).toHaveLength(4);
      expect(res.body.data.tiers[0].name).toBe('FREE');
      expect(res.body.data.tiers[3].name).toBe('GOLD');
    });
  });
});

describe('Digital Twin Routes', () => {
  const testUserId = 'user-test-dt';
  const testToken = generateTestToken(testUserId);

  beforeEach(() => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });
  });

  describe('GET /api/v1/digital-twins', () => {
    it('should list digital twins', async () => {
      (mockPrisma.digitalTwin.findMany as jest.Mock).mockResolvedValue([
        { id: 'twin-1', name: 'Twin One', status: 'READY' },
      ]);

      const res = await request(app)
        .get('/api/v1/digital-twins')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/digital-twins/:id', () => {
    it('should get a single digital twin', async () => {
      (mockPrisma.digitalTwin.findFirst as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        name: 'Twin One',
        status: 'READY',
      });

      const res = await request(app)
        .get('/api/v1/digital-twins/twin-1')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('twin-1');
    });
  });

  describe('PUT /api/v1/digital-twins/:id', () => {
    it('should update a digital twin', async () => {
      (mockPrisma.digitalTwin.findFirst as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        talentId: testUserId,
      });

      (mockPrisma.digitalTwin.update as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        name: 'Updated Name',
      });

      const res = await request(app)
        .put('/api/v1/digital-twins/twin-1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/digital-twins/:id', () => {
    it('should delete a digital twin', async () => {
      (mockPrisma.digitalTwin.findFirst as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        talentId: testUserId,
      });

      (mockPrisma.digitalTwin.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .delete('/api/v1/digital-twins/twin-1')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('POST /api/v1/digital-twins/:id/consent', () => {
    it('should sign consent for a digital twin', async () => {
      (mockPrisma.digitalTwin.findFirst as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        talentId: testUserId,
      });

      (mockPrisma.digitalTwin.update as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        consentSigned: true,
        consentSignedAt: new Date(),
      });

      (mockPrisma.contract.upsert as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/digital-twins/twin-1/consent')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ consent: true });

      expect(res.status).toBe(200);
      expect(res.body.data.consentSigned).toBe(true);
    });

    it('should reject missing consent flag', async () => {
      const res = await request(app)
        .post('/api/v1/digital-twins/twin-1/consent')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/digital-twins/:id/usage', () => {
    it('should get usage analytics', async () => {
      (mockPrisma.digitalTwin.findFirst as jest.Mock).mockResolvedValue({
        id: 'twin-1',
        talentId: testUserId,
      });

      (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(3);

      (mockPrisma.aiGeneration.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/digital-twins/twin-1/usage')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.twinId).toBe('twin-1');
    });
  });
});

describe('Credit Check Middleware', () => {
  const testUserId = 'user-test-credits';

  it('should block generation when credit limit is reached', async () => {
    const token = generateTestToken(testUserId, 'TALENT');

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });

    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      tier: 'FREE',
      status: 'ACTIVE',
    });

    // Free tier = 3 credits, user has used 3
    (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .post('/api/v1/ai/generate/scene')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'A test scene',
        genre: 'drama',
        characterName: 'Test',
        emotion: 'happy',
      });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
  });

  it('should allow unlimited generations for Gold tier', async () => {
    const token = generateTestToken(testUserId, 'TALENT');

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com',
      role: 'TALENT',
    });

    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      tier: 'GOLD',
      status: 'ACTIVE',
    });

    // Even with 1000 used, Gold should pass
    (mockPrisma.aiGeneration.count as jest.Mock).mockResolvedValue(1000);

    (mockPrisma.aiGeneration.create as jest.Mock).mockResolvedValue({
      id: 'gen-1',
      userId: testUserId,
      type: 'SCENE',
      status: 'PROCESSING',
    });

    (mockPrisma.aiGeneration.update as jest.Mock).mockResolvedValue({
      id: 'gen-1',
      status: 'COMPLETED',
    });

    mockAiService.generateScene.mockResolvedValue({
      script: 'Test',
      imageUrls: [],
    });

    const res = await request(app)
      .post('/api/v1/ai/generate/scene')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'A test scene',
        genre: 'drama',
        characterName: 'Test',
        emotion: 'happy',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
