import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ContractType, ContractStatus } from '@prisma/client';

const CONTRACT_TEMPLATES: Record<ContractType, string> = {
  TALENT: `TALENT AGREEMENT

This Talent Agreement is entered into between the Talent and Big Starz Casting Platform.

1. REPRESENTATION: The Talent grants the Platform a non-exclusive license to display their profile, headshots, and reel for casting purposes.
2. COMPENSATION: The Talent agrees that all compensation for casting engagements will be negotiated directly with the casting director.
3. TERMINATION: Either party may terminate this agreement with 30 days written notice.
4. GOVERNING LAW: This agreement shall be governed by the laws of the State of California.
`,
  AI_CONSENT: `AI CONSENT AGREEMENT

This AI Consent Agreement governs the use of artificial intelligence in content generation.

1. CONSENT: The Talent consents to the use of their likeness and data for AI-generated content, including digital twins, scene generation, and reel enhancement.
2. REVOCATION: The Talent may revoke this consent at any time, at which point no new AI content will be generated.
3. OWNERSHIP: AI-generated content remains the property of the Talent, subject to a non-exclusive license to the Platform for promotional purposes.
4. DATA RETENTION: All training data used for digital twins will be deleted upon request or account termination.
`,
  DIGITAL_TWIN: `DIGITAL TWIN AGREEMENT

This Digital Twin Agreement governs the creation and use of digital replicas of the Talent.

1. SCOPE: The Talent authorizes the Platform to create and maintain a digital twin based on provided images, videos, and audio.
2. USES: The digital twin may be used for casting simulations, scene previews, and portfolio enhancement.
3. RESTRICTIONS: The digital twin may not be used for commercial endorsements without separate written consent.
4. WATERMARKING: All digital twin content will be visibly watermarked to indicate AI generation.
`,
  CASTING_DIRECTOR: `CASTING DIRECTOR AGREEMENT

This agreement governs the relationship between the Casting Director and Big Starz Casting Platform.

1. SERVICES: The Platform provides talent discovery, application management, and communication tools.
2. FEES: Casting directors may post casting calls for free. Premium features are subject to subscription fees.
3. CONFIDENTIALITY: All talent information is confidential and may not be shared with third parties.
4. COMPLIANCE: All casting activities must comply with SAG-AFTRA regulations where applicable.
`,
  ADVERTISER: `ADVERTISER AGREEMENT

This Advertiser Agreement governs the placement of advertisements on the Big Starz Platform.

1. AD PLACEMENT: Advertisements may be placed on talent profiles, casting pages, and content feeds.
2. CONTENT RESTRICTIONS: No adult, illegal, or deceptive advertising content is permitted.
3. PAYMENT: All advertising fees are paid in advance through the Platform's payment system.
4. REPORTING: The Platform provides monthly analytics reports on ad performance and impressions.
`,
};

export class ContractService {
  /**
   * List all contracts for a user
   */
  static async listContracts(userId: string) {
    const contracts = await prisma.contract.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return contracts;
  }

  /**
   * Get a single contract by ID
   */
  static async getContractById(id: string, userId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, userId },
    });

    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }

    return contract;
  }

  /**
   * Sign a contract
   */
  static async signContract(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const contract = await prisma.contract.findFirst({
      where: { id, userId },
    });

    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }

    if (contract.status === 'SIGNED') {
      throw ApiError.conflict('Contract has already been signed');
    }

    if (contract.status === 'REVOKED') {
      throw ApiError.badRequest('Contract has been revoked and cannot be signed');
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return updated;
  }

  /**
   * List available contract types
   */
  static async listContractTypes() {
    return Object.entries(CONTRACT_TEMPLATES).map(([type, content]) => ({
      type,
      name: this.getContractTypeName(type as ContractType),
      description: this.getContractTypeDescription(type as ContractType),
      preview: content.substring(0, 200) + '...',
    }));
  }

  /**
   * Generate a contract for a user
   */
  static async generateContract(userId: string, type: ContractType) {
    const template = CONTRACT_TEMPLATES[type];
    if (!template) {
      throw ApiError.badRequest('Invalid contract type');
    }

    // Check if user already has an unsigned contract of this type
    const existing = await prisma.contract.findFirst({
      where: { userId, type, status: 'PENDING' },
    });

    if (existing) {
      throw ApiError.conflict('User already has a pending contract of this type');
    }

    const contract = await prisma.contract.create({
      data: {
        userId,
        type,
        content: template,
        status: 'PENDING',
      },
    });

    return contract;
  }

  private static getContractTypeName(type: ContractType): string {
    const names: Record<ContractType, string> = {
      TALENT: 'Talent Agreement',
      AI_CONSENT: 'AI Consent Agreement',
      DIGITAL_TWIN: 'Digital Twin Agreement',
      CASTING_DIRECTOR: 'Casting Director Agreement',
      ADVERTISER: 'Advertiser Agreement',
    };
    return names[type] || type;
  }

  private static getContractTypeDescription(type: ContractType): string {
    const descriptions: Record<ContractType, string> = {
      TALENT: 'Governs the relationship between talent and the platform for casting purposes.',
      AI_CONSENT: 'Consent for AI-powered content generation including digital twins and scene generation.',
      DIGITAL_TWIN: 'Specific agreement for the creation, storage, and use of digital twin replicas.',
      CASTING_DIRECTOR: 'Terms for casting directors using the platform to discover and manage talent.',
      ADVERTISER: 'Terms for advertisers placing ads on the platform.',
    };
    return descriptions[type] || '';
  }
}

export default ContractService;
