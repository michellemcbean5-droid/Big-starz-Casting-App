import { PrismaClient, UserRole, SubscriptionTier, CastingCallStatus, CastingCallType, ApplicationStatus, UnionStatus, DigitalTwinStatus, SubscriptionStatus, ContractType, ContractStatus, EarningSource, EarningStatus, AiGenerationType, AiGenerationStatus, DMCATakedownStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // ─── Clean existing data (optional, for dev) ─────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.aiGeneration.deleteMany();
  await prisma.earning.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.dmcaTakedown.deleteMany();
  await prisma.masterCode.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.digitalTwin.deleteMany();
  await prisma.application.deleteMany();
  await prisma.castingCall.deleteMany();
  await prisma.talentProfile.deleteMany();
  await prisma.castingDirectorProfile.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // ─── Create Users ────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const talentPassword = await bcrypt.hash('Talent123!', 12);
  const directorPassword = await bcrypt.hash('Director123!', 12);
  const creatorPassword = await bcrypt.hash('Creator123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@bigstarz.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          displayName: 'Admin',
          bio: 'Platform administrator',
        },
      },
    },
  });

  const talent1 = await prisma.user.create({
    data: {
      email: 'talent1@bigstarz.com',
      passwordHash: talentPassword,
      role: UserRole.TALENT,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          displayName: 'Sarah J.',
          bio: 'Versatile actress with 5 years of experience in film and TV.',
          location: 'Los Angeles, CA',
          phone: '+1-555-0101',
          dateOfBirth: new Date('1995-06-15'),
          isMinor: false,
          talentProfile: {
            create: {
              stageName: 'Sarah Jay',
              unionStatus: UnionStatus.SAG_AFTRA,
              skills: ['Acting', 'Singing', 'Dancing', 'Voiceover'],
              experienceYears: 5,
              height: '5\'7"',
              weight: '125 lbs',
              ethnicity: 'Caucasian',
              languages: ['English', 'Spanish'],
              reelUrl: 'https://example.com/reels/sarah-johnson',
              portfolioUrls: ['https://example.com/portfolio/sarah-1'],
              availability: 'Available for auditions weekdays and weekends',
              isFeatured: true,
              rankingScore: 4.8,
            },
          },
        },
      },
    },
  });

  const talent2 = await prisma.user.create({
    data: {
      email: 'talent2@bigstarz.com',
      passwordHash: talentPassword,
      role: UserRole.TALENT,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Marcus',
          lastName: 'Williams',
          displayName: 'Marcus W.',
          bio: 'Young aspiring actor, fresh out of drama school.',
          location: 'New York, NY',
          phone: '+1-555-0102',
          dateOfBirth: new Date('2002-03-22'),
          isMinor: false,
          talentProfile: {
            create: {
              stageName: 'Marcus W.',
              unionStatus: UnionStatus.NON_UNION,
              skills: ['Acting', 'Improv', 'Stage Combat'],
              experienceYears: 1,
              height: '6\'1"',
              weight: '180 lbs',
              ethnicity: 'African American',
              languages: ['English'],
              availability: 'Available for local auditions',
              isFeatured: false,
              rankingScore: 3.5,
            },
          },
        },
      },
    },
  });

  const director = await prisma.user.create({
    data: {
      email: 'director@bigstarz.com',
      passwordHash: directorPassword,
      role: UserRole.CASTING_DIRECTOR,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Rebecca',
          lastName: 'Chen',
          displayName: 'Rebecca Chen',
          bio: 'Award-winning casting director with 15+ years of experience.',
          location: 'Los Angeles, CA',
          phone: '+1-555-0201',
          castingDirectorProfile: {
            create: {
              companyName: 'Chen Casting Studios',
              companyWebsite: 'https://chencasting.com',
              credits: ['Blockbuster Movie (2023)', 'TV Series "The City" (2022)', 'Indie Film "Sunset" (2021)'],
              verified: true,
            },
          },
        },
      },
    },
  });

  const creator = await prisma.user.create({
    data: {
      email: 'creator@bigstarz.com',
      passwordHash: creatorPassword,
      role: UserRole.CREATOR,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Rivera',
          displayName: 'Alex R.',
          bio: 'Content creator and filmmaker exploring AI-enhanced storytelling.',
          location: 'Austin, TX',
          phone: '+1-555-0301',
        },
      },
    },
  });

  console.log('👤 Created users:', { admin: admin.id, talent1: talent1.id, talent2: talent2.id, director: director.id, creator: creator.id });

  // ─── Create Subscriptions ────────────────────────────────────────────

  await prisma.subscription.create({
    data: {
      userId: talent1.id,
      tier: SubscriptionTier.SILVER,
      price: 29.99,
      startDate: new Date('2024-01-01'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: talent2.id,
      tier: SubscriptionTier.FREE,
      price: 0,
      startDate: new Date('2024-01-01'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: director.id,
      tier: SubscriptionTier.GOLD,
      price: 99.99,
      startDate: new Date('2024-01-01'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  console.log('💳 Created subscriptions');

  // ─── Create Casting Calls ────────────────────────────────────────────

  const castingCall1 = await prisma.castingCall.create({
    data: {
      title: 'Lead Role in Sci-Fi Feature Film',
      description: 'Seeking a charismatic lead actor (25-35) for an upcoming sci-fi feature film. Must have experience with action sequences and be comfortable with green screen work.',
      directorId: director.id,
      status: CastingCallStatus.OPEN,
      type: CastingCallType.FILM,
      location: 'Los Angeles, CA',
      remoteOk: false,
      budget: 500000,
      compensation: '$50,000 - $100,000',
      deadline: new Date('2024-03-01'),
      requirements: {
        ageRange: '25-35',
        gender: 'Any',
        ethnicity: 'Any',
        unionStatus: 'SAG-AFTRA preferred',
        experience: '3+ years film experience',
        specialSkills: ['Action', 'Green screen experience'],
      },
      roles: [
        { name: 'Lead Character', description: 'Protagonist, charismatic and resourceful', type: 'Lead' },
        { name: 'Supporting Role', description: 'Best friend of protagonist', type: 'Supporting' },
      ],
    },
  });

  const castingCall2 = await prisma.castingCall.create({
    data: {
      title: 'Commercial - Sports Brand Campaign',
      description: 'Looking for athletic talent for a major sports brand commercial. High energy, authentic athletic look.',
      directorId: director.id,
      status: CastingCallStatus.OPEN,
      type: CastingCallType.COMMERCIAL,
      location: 'New York, NY',
      remoteOk: false,
      budget: 75000,
      compensation: '$2,000 - $5,000 per day',
      deadline: new Date('2024-02-15'),
      requirements: {
        ageRange: '18-30',
        gender: 'Any',
        ethnicity: 'Any',
        unionStatus: 'Union and Non-Union welcome',
        experience: 'Commercial experience preferred',
        specialSkills: ['Athletic ability', 'High energy'],
      },
      roles: [
        { name: 'Lead Athlete', description: 'Main athlete in commercial', type: 'Lead' },
        { name: 'Background Athletes', description: 'Group fitness scene', type: 'Background', count: 10 },
      ],
    },
  });

  console.log('🎬 Created casting calls');

  // ─── Create Applications ─────────────────────────────────────────────

  await prisma.application.create({
    data: {
      talentId: talent1.id,
      castingCallId: castingCall1.id,
      status: ApplicationStatus.SHORTLISTED,
      coverLetter: 'I am very excited about this role! My experience in sci-fi films aligns perfectly with your requirements. I have extensive green screen experience from my last three projects.',
      videoUrl: 'https://example.com/auditions/sarah-scifi.mp4',
      notes: 'Excellent reel, strong presence. Callback scheduled.',
    },
  });

  await prisma.application.create({
    data: {
      talentId: talent2.id,
      castingCallId: castingCall1.id,
      status: ApplicationStatus.PENDING,
      coverLetter: 'I am a fresh graduate from NYU Tisch and would love the opportunity to audition for this role. I am a quick learner and very passionate about sci-fi.',
    },
  });

  console.log('📝 Created applications');

  // ─── Create Digital Twins ────────────────────────────────────────────

  await prisma.digitalTwin.create({
    data: {
      talentId: talent1.id,
      name: 'Sarah Jay Digital',
      description: 'Digital twin trained for scene generation and AI-enhanced auditions.',
      modelData: {
        modelVersion: 'v1.0.2',
        trainingData: '500+ headshots, 20 video clips',
        modelUrl: 'https://models.bigstarz.com/sarah-jay-v1',
      },
      thumbnailUrl: 'https://cdn.bigstarz.com/twins/sarah-jay-thumb.jpg',
      consentSigned: true,
      consentSignedAt: new Date('2024-01-15'),
      status: DigitalTwinStatus.READY,
    },
  });

  console.log('🤖 Created digital twins');

  // ─── Create Master Codes ─────────────────────────────────────────────

  await prisma.masterCode.create({
    data: {
      code: 'STARZ2024FREE',
      tier: SubscriptionTier.FREE,
      maxUses: 100,
      usedCount: 12,
      expiresAt: new Date('2024-12-31'),
      revoked: false,
      createdBy: admin.id,
    },
  });

  await prisma.masterCode.create({
    data: {
      code: 'BRONZEACCESS',
      tier: SubscriptionTier.BRONZE,
      maxUses: 50,
      usedCount: 3,
      expiresAt: new Date('2024-06-30'),
      revoked: false,
      createdBy: admin.id,
    },
  });

  console.log('🔑 Created master codes');

  // ─── Create Contracts ────────────────────────────────────────────────

  await prisma.contract.create({
    data: {
      userId: talent1.id,
      type: ContractType.AI_CONSENT,
      content: 'I consent to the creation and use of my digital twin for AI-generated content on the Big Starz platform. I understand my likeness may be used in AI-generated scenes, reels, and promotional materials.',
      signedAt: new Date('2024-01-15'),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: ContractStatus.SIGNED,
    },
  });

  await prisma.contract.create({
    data: {
      userId: talent2.id,
      type: ContractType.TALENT,
      content: 'Standard talent agreement for the Big Starz Casting Platform.',
      status: ContractStatus.PENDING,
    },
  });

  console.log('📄 Created contracts');

  // ─── Create Earnings ─────────────────────────────────────────────────

  await prisma.earning.create({
    data: {
      userId: talent1.id,
      amount: 150.0,
      currency: 'USD',
      source: EarningSource.ENGAGEMENT,
      description: 'Revenue share from featured profile views and content engagement',
      status: EarningStatus.PAID,
      paidAt: new Date('2024-01-31'),
    },
  });

  await prisma.earning.create({
    data: {
      userId: creator.id,
      amount: 450.0,
      currency: 'USD',
      source: EarningSource.AD_REVENUE,
      description: 'Ad revenue from AI-generated content views',
      status: EarningStatus.PENDING,
    },
  });

  console.log('💰 Created earnings');

  // ─── Create AI Generations ───────────────────────────────────────────

  await prisma.aiGeneration.create({
    data: {
      userId: talent1.id,
      type: AiGenerationType.SCENE,
      inputData: {
        prompt: 'Sci-fi scene: astronaut discovering ancient ruins on Mars',
        style: 'Cinematic',
        duration: 30,
      },
      outputUrl: 'https://cdn.bigstarz.com/generations/scene-001.mp4',
      costCredits: 10,
      status: AiGenerationStatus.COMPLETED,
    },
  });

  await prisma.aiGeneration.create({
    data: {
      userId: creator.id,
      type: AiGenerationType.REEL,
      inputData: {
        clips: ['clip1.mp4', 'clip2.mp4', 'clip3.mp4'],
        music: 'upbeat-electronic',
        style: 'Dynamic cuts',
      },
      costCredits: 25,
      status: AiGenerationStatus.PROCESSING,
    },
  });

  console.log('🎨 Created AI generations');

  // ─── Create DMCA Takedowns ───────────────────────────────────────────

  await prisma.dMCATakedown.create({
    data: {
      requesterEmail: 'rights@examplestudio.com',
      infringingUrl: 'https://cdn.bigstarz.com/user-content/infringing-video.mp4',
      originalWorkUrl: 'https://originalstudio.com/film/my-movie',
      description: 'This video contains unauthorized footage from our copyrighted film "My Movie" (2023).',
      status: DMCATakedownStatus.PENDING,
    },
  });

  console.log('⚖️ Created DMCA takedowns');

  // ─── Create Audit Logs ───────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'MASTER_CODE_CREATED',
        entityType: 'MasterCode',
        metadata: { code: 'STARZ2024FREE', tier: 'FREE' },
        ipAddress: '192.168.1.1',
      },
      {
        userId: talent1.id,
        action: 'PROFILE_UPDATED',
        entityType: 'Profile',
        entityId: talent1.id,
        metadata: { fieldsChanged: ['bio', 'reelUrl'] },
        ipAddress: '192.168.1.100',
      },
      {
        userId: director.id,
        action: 'CASTING_CALL_CREATED',
        entityType: 'CastingCall',
        entityId: castingCall1.id,
        metadata: { title: 'Lead Role in Sci-Fi Feature Film' },
        ipAddress: '192.168.1.200',
      },
    ],
  });

  console.log('📋 Created audit logs');

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e: Error) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
