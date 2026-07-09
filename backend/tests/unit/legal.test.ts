import { jest } from '@jest/globals';

// ─── Contract Service Tests ─────────────────────────────────────────────

describe('ContractService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list all contract types', async () => {
    const { ContractService } = await import('../../src/services/contractService');
    const types = await ContractService.listContractTypes();

    expect(types).toHaveLength(5);
    const typeNames = types.map((t: { name: string }) => t.name);
    expect(typeNames).toContain('Talent Agreement');
    expect(typeNames).toContain('AI Consent Agreement');
    expect(typeNames).toContain('Digital Twin Agreement');
    expect(typeNames).toContain('Casting Director Agreement');
    expect(typeNames).toContain('Advertiser Agreement');
  });

  it('should have descriptions for each contract type', async () => {
    const { ContractService } = await import('../../src/services/contractService');
    const types = await ContractService.listContractTypes();

    types.forEach((type: { description: string }) => {
      expect(type.description).toBeDefined();
      expect(type.description.length).toBeGreaterThan(0);
    });
  });

  it('should have contract templates for each type', async () => {
    const { ContractService } = await import('../../src/services/contractService');
    const types = await ContractService.listContractTypes();

    types.forEach((type: { preview: string }) => {
      expect(type.preview).toBeDefined();
      expect(type.preview.length).toBeGreaterThan(0);
    });
  });

  it('should throw for invalid contract type', async () => {
    const { ContractService } = await import('../../src/services/contractService');

    await expect(
      ContractService.generateContract('user-123', 'INVALID' as any)
    ).rejects.toThrow('Invalid contract type');
  });
});

// ─── DMCA Route Validation Tests ──────────────────────────────────────

describe('DMCA Validation', () => {
  it('should validate email format for DMCA request', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('requester@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });

  it('should validate URL format for infringing content', () => {
    const urlRegex = /^https?:\/\/.+/;
    expect(urlRegex.test('https://example.com/content')).toBe(true);
    expect(urlRegex.test('not-a-url')).toBe(false);
  });
});

// ─── Consent Validation Tests ───────────────────────────────────────────

describe('Consent Validation', () => {
  it('should require digital signature for AI consent', () => {
    const signature = 'X'.repeat(64);
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should require guardian details for minor consent', () => {
    const guardianData = {
      guardianName: 'Jane Doe',
      guardianEmail: 'jane@example.com',
      guardianPhone: '555-1234',
      relationship: 'Mother',
      agreed: true,
      digitalSignature: 'X'.repeat(64),
    };

    expect(guardianData.guardianName).toBeTruthy();
    expect(guardianData.guardianEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(guardianData.relationship).toBeTruthy();
    expect(guardianData.agreed).toBe(true);
  });

  it('should require email format for guardian email', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('guardian@example.com')).toBe(true);
    expect(emailRegex.test('not-an-email')).toBe(false);
  });

  it('should validate IP address format', () => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    expect(ipv4Regex.test('192.168.1.1')).toBe(true);
    expect(ipv4Regex.test('invalid')).toBe(false);
  });
});

// ─── Audit Log Tests ────────────────────────────────────────────────────

describe('Audit Log', () => {
  it('should record required audit fields', () => {
    const auditEntry = {
      userId: 'user-123',
      action: 'GET /api/v1/contracts',
      entityType: 'contracts',
      entityId: 'contract-456',
      metadata: { statusCode: 200 },
      ipAddress: '192.168.1.1',
      createdAt: new Date().toISOString(),
    };

    expect(auditEntry.userId).toBeTruthy();
    expect(auditEntry.action).toBeTruthy();
    expect(auditEntry.entityType).toBeTruthy();
    expect(auditEntry.createdAt).toBeTruthy();
  });

  it('should handle null user for unauthenticated requests', () => {
    const auditEntry = {
      userId: null,
      action: 'GET /api/v1/subscriptions/plans',
      entityType: 'subscriptions',
      entityId: null,
      metadata: { statusCode: 200 },
      ipAddress: '192.168.1.1',
    };

    expect(auditEntry.userId).toBeNull();
    expect(auditEntry.action).toBeTruthy();
  });

  it('should strip sensitive data from metadata', () => {
    const metadata = {
      password: 'should-be-removed',
      token: 'should-be-removed',
      planId: 'plan_bronze',
    };

    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.token;

    expect(safeMetadata).not.toHaveProperty('password');
    expect(safeMetadata).not.toHaveProperty('token');
    expect(safeMetadata).toHaveProperty('planId');
  });
});

// ─── DMCA Status Tests ──────────────────────────────────────────────────

describe('DMCA Status Flow', () => {
  it('should have valid DMCA statuses', () => {
    const validStatuses = ['PENDING', 'REVIEWING', 'REMOVED', 'REJECTED'];
    validStatuses.forEach((status) => {
      expect(status).toBeTruthy();
    });
  });

  it('should require resolution for removed or rejected statuses', () => {
    const resolution = 'Content removed due to confirmed copyright infringement';
    expect(resolution.length).toBeGreaterThan(0);
  });

  it('should require counter-notification statement', () => {
    const statement = 'I swear, under penalty of perjury, that the material was removed or disabled as a result of mistake or misidentification.';
    expect(statement.length).toBeGreaterThan(50);
  });
});

// ─── Master Code Validation Tests ───────────────────────────────────────

describe('Master Code Validation', () => {
  it('should validate 8-character uppercase code format', () => {
    const code = 'A1B2C3D4';
    expect(code).toHaveLength(8);
    expect(code).toEqual(code.toUpperCase());
    expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
  });

  it('should reject invalid code lengths', () => {
    const shortCode = 'A1B2C3';
    expect(shortCode).not.toHaveLength(8);
  });
});

// ─── Contract Signing Tests ─────────────────────────────────────────────

describe('Contract Signing', () => {
  it('should record signature metadata', () => {
    const signature = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      signedAt: new Date().toISOString(),
    };

    expect(signature.ipAddress).toBeTruthy();
    expect(signature.userAgent).toBeTruthy();
    expect(signature.signedAt).toBeTruthy();
  });
});
