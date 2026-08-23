import { PrismaClient, SkillCategory, SkillProficiency } from '@prisma/client';

const prisma = new PrismaClient();

// Chief AI Architect Skills (Agentic & Generative Systems)
const aiArchitectureSkills = [
  {
    name: 'Multi-Agent Task Orchestration',
    description: 'Ability to coordinate autonomous sub-agents (Routing, Consent, Safety, Diffusion) to handle multi-step development loops without dropping conversational state',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['multi-agent', 'orchestration', 'autonomous', 'conversational-state']
  },
  {
    name: 'Diffusion Pipeline Integration',
    description: 'Expertise in writing inference connectors for text-to-video models (SVD-style) and injecting custom talent face weights via LoRA checkpoints',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['diffusion', 'pipeline', 'SVD', 'LoRA', 'fine-tuning', 'text-to-video']
  },
  {
    name: 'Semantic Routing & Vector Indexing',
    description: 'Capability to structure Pinecone/Milvus vector databases, dense vector embeddings, and cosine similarity queries for rapid talent discovery',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['semantic-routing', 'vector-database', 'Pinecone', 'Milvus', 'embeddings', 'similarity-search']
  },
  {
    name: 'Autonomous Moderation & Safety Guardrail Design',
    description: 'Skill in engineering automated content filters, deepfake classification nodes, and trademark screening pipelines',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['moderation', 'safety', 'guardrails', 'content-filtering', 'deepfake-detection', 'trademark-screening']
  },
  {
    name: 'Temporal Consistency & Frame Interpolation',
    description: 'Proficiency in configuring latent space optimization, frame interpolation (RIFE), and frame-rate smoothing algorithms to prevent video artifacting',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['temporal-consistency', 'frame-interpolation', 'RIFE', 'latent-optimization', 'video-processing']
  },
  {
    name: 'Audio-Visual Latent Alignment',
    description: 'Expertise in syncing audio stems (Hip-Hop/R&B beat drops and tempos) with video cuts and Wav2Lip synchronization models',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['audio-visual', 'latent-alignment', 'Wav2Lip', 'beat-sync', 'tempo-matching']
  },
  {
    name: 'Context Window Optimization & Pruning',
    description: 'Ability to manage token allocation efficiently, using prompt compression and structured outputs across heavy API payloads',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['context-window', 'optimization', 'prompt-compression', 'token-allocation', 'structured-outputs']
  },
  {
    name: 'Explainable AI Logging',
    description: 'Skill in building transparent decision audit trails that track why an agent approved or halted a generative request',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['explainable-AI', 'XAI', 'audit-trails', 'decision-logging', 'transparency']
  },
  {
    name: 'Edge AI Model Quantization',
    description: 'Expertise in optimizing models for INT8/FP16 edge inference and managing GPU VRAM memory constraints',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['model-quantization', 'edge-AI', 'INT8', 'FP16', 'GPU-optimization', 'VRAM-management']
  },
  {
    name: 'RLHF & Guardrail Alignment',
    description: 'Proficiency in embedding reinforcement learning feedback loops to continually refine generation styling and safety parameters',
    category: SkillCategory.AI_ARCHITECTURE,
    tags: ['RLHF', 'guardrail-alignment', 'reinforcement-learning', 'safety-parameters', 'generation-refinement']
  }
];

// Principal Software Engineer Skills (Backend & Infrastructure)
const backendInfrastructureSkills = [
  {
    name: 'Microservices Architecture & API Gateway Design',
    description: 'Mastery over building scalable FastAPI endpoints, reverse proxies, rate limiting, and event-driven message queues (Kafka/RabbitMQ)',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['microservices', 'API-gateway', 'FastAPI', 'reverse-proxy', 'rate-limiting', 'Kafka', 'RabbitMQ']
  },
  {
    name: 'Asynchronous Non-Blocking I/O & Concurrency',
    description: 'Skill in handling high-throughput asynchronous tasks via Python Asyncio, Celery workers, and Redis caching layers',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['async', 'non-blocking', 'concurrency', 'Asyncio', 'Celery', 'Redis', 'high-throughput']
  },
  {
    name: 'Advanced Relational & NoSQL Data Modeling',
    description: 'Expertise in designing normalized PostgreSQL schemas (AsyncPG/SQLAlchemy) alongside unstructured MongoDB collections for real-time chat data',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['data-modeling', 'PostgreSQL', 'AsyncPG', 'SQLAlchemy', 'MongoDB', 'NoSQL', 'real-time-data']
  },
  {
    name: 'Stripe Connect & Split-Commission Engineering',
    description: 'Proficiency in integrating multi-tenant payment gateways, automated escrow releases, and dynamic B2B revenue-sharing algorithms',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['Stripe-Connect', 'payment-gateway', 'escrow', 'revenue-sharing', 'B2B', 'multi-tenant']
  },
  {
    name: 'OAuth 2.0 & Role-Based Access Control (RBAC)',
    description: 'Ability to write secure authentication flows featuring JWT token rotation, bcrypt hashing, and granular user-role permissions',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['OAuth-2.0', 'RBAC', 'authentication', 'JWT', 'token-rotation', 'bcrypt', 'permissions']
  },
  {
    name: 'Kubernetes & Cloud Infrastructure Automation',
    description: 'Skill in writing Terraform scripts, Docker multi-stage builds, and K8s orchestration manifests for AWS/EKS deployment',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['Kubernetes', 'Terraform', 'Docker', 'cloud-infrastructure', 'AWS', 'EKS', 'orchestration']
  },
  {
    name: 'CI/CD Pipeline Automation',
    description: 'Expertise in structuring GitHub Actions workflows for automated linting, test execution, container pushing, and release compilation',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['CI/CD', 'GitHub-Actions', 'automation', 'linting', 'testing', 'containerization', 'release-management']
  },
  {
    name: 'Distributed Tracing & APM Telemetry',
    description: 'Proficiency in integrating OpenTelemetry, Prometheus, and Grafana for real-time container monitoring and latency tracking',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['distributed-tracing', 'APM', 'OpenTelemetry', 'Prometheus', 'Grafana', 'monitoring', 'latency-tracking']
  },
  {
    name: 'Idempotent API & Circuit Breaker Patterns',
    description: 'Ability to construct fault-tolerant endpoints that handle network partitions and graceful degradations seamlessly',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['idempotent-API', 'circuit-breaker', 'fault-tolerance', 'network-partitions', 'graceful-degradation']
  },
  {
    name: 'Security Sanitization & XSS/SQLi Mitigation',
    description: 'Skill in implementing strict input validation, CORS enforcement, and vulnerability scanning rules across the codebase',
    category: SkillCategory.BACKEND_INFRASTRUCTURE,
    tags: ['security', 'sanitization', 'XSS', 'SQL-injection', 'input-validation', 'CORS', 'vulnerability-scanning']
  }
];

// Lead Full-Stack Mobile Developer Skills (React Native & Android)
const fullstackMobileSkills = [
  {
    name: 'React Native CLI & Hermes Engine Optimization',
    description: 'Mastery over cross-platform compilation, TurboModules, and Fabric native rendering configurations for maximum performance',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['React-Native', 'Hermes', 'TurboModules', 'Fabric', 'cross-platform', 'performance-optimization']
  },
  {
    name: 'Advanced State Management (RTK & RTK Query)',
    description: 'Expertise in structuring Redux Toolkit global stores, normalized data caching, and asynchronous data fetching',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['state-management', 'Redux-Toolkit', 'RTK-Query', 'normalized-caching', 'async-data']
  },
  {
    name: 'Virtualized List & DOM Performance Tuning',
    description: 'Skill in implementing memory-efficient FlatList structures, windowSize tuning, and DOM virtualization to ensure smooth 60 FPS scrolling reels',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['virtualized-list', 'FlatList', 'DOM-virtualization', 'performance-tuning', '60-FPS', 'scrolling']
  },
  {
    name: 'Reanimated 3 Worklet Animations',
    description: 'Proficiency in building fluid, native-driver-powered gestures, animated overlays, and dynamic UI transitions',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['Reanimated', 'worklets', 'animations', 'gestures', 'native-driver', 'UI-transitions']
  },
  {
    name: 'Android App Bundle (.aab) & Gradle Compilation',
    description: 'Expertise in configuring build.gradle, ProGuard/R8 code shrinking, and generating signed release bundles for the Google Play Console',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['Android', 'App-Bundle', 'Gradle', 'ProGuard', 'R8', 'code-shrinking', 'Google-Play']
  },
  {
    name: 'Offline-First Synchronization (WatermelonDB)',
    description: 'Skill in designing local database caching layers to maintain core app utility during low-bandwidth conditions',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['offline-first', 'WatermelonDB', 'local-caching', 'sync', 'low-bandwidth', 'data-persistence']
  },
  {
    name: 'Biometric Security & Secure Storage',
    description: 'Proficiency in integrating Android BiometricPrompt and EncryptedSharedPreferences/KeyStore for secure token management',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['biometric-security', 'BiometricPrompt', 'EncryptedSharedPreferences', 'KeyStore', 'secure-storage', 'token-management']
  },
  {
    name: 'ExoPlayer & Media Buffer Management',
    description: 'Ability to configure hardware-accelerated video decoding, adaptive streaming (HLS/DASH), and seamless looping for video feeds',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['ExoPlayer', 'media-buffer', 'hardware-acceleration', 'HLS', 'DASH', 'adaptive-streaming', 'video-playback']
  },
  {
    name: 'Real-Time WebSocket Integration',
    description: 'Skill in setting up Socket.io connection managers for live chat rooms, typing indicators, and instant messaging updates',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['WebSocket', 'Socket.io', 'real-time', 'chat', 'typing-indicators', 'instant-messaging']
  },
  {
    name: 'Over-The-Air (OTA) & Deep Linking Architecture',
    description: 'Expertise in configuring Android App Links (bigstarz://) and remote update mechanisms for frictionless app maintenance',
    category: SkillCategory.FULLSTACK_MOBILE,
    tags: ['OTA-updates', 'deep-linking', 'Android-App-Links', 'remote-updates', 'app-maintenance']
  }
];

// Additional categories for system design and production
const systemDesignSkills = [
  {
    name: 'System Architecture Design',
    description: 'Ability to design scalable, maintainable, and efficient system architectures',
    category: SkillCategory.SYSTEM_DESIGN,
    tags: ['architecture', 'scalability', 'system-design', 'maintainability']
  },
  {
    name: 'Database Schema Design',
    description: 'Expertise in creating optimized database schemas for performance and data integrity',
    category: SkillCategory.SYSTEM_DESIGN,
    tags: ['database-design', 'schema', 'performance', 'data-integrity']
  }
];

const productionDeploymentSkills = [
  {
    name: 'Docker Containerization',
    description: 'Skill in creating and managing Docker containers for application deployment',
    category: SkillCategory.PRODUCTION_DEPLOYMENT,
    tags: ['Docker', 'containerization', 'deployment', 'microservices']
  },
  {
    name: 'Monitoring & Logging',
    description: 'Expertise in setting up monitoring, logging, and alerting systems',
    category: SkillCategory.PRODUCTION_DEPLOYMENT,
    tags: ['monitoring', 'logging', 'alerting', 'observability']
  }
];

const dataAnalyticsSkills = [
  {
    name: 'Data Analysis & Visualization',
    description: 'Ability to analyze data and create meaningful visualizations',
    category: SkillCategory.DATA_ANALYTICS,
    tags: ['data-analysis', 'visualization', 'analytics', 'insights']
  },
  {
    name: 'Machine Learning Pipeline Design',
    description: 'Skill in designing and implementing machine learning pipelines',
    category: SkillCategory.DATA_ANALYTICS,
    tags: ['machine-learning', 'pipeline', 'ML', 'data-science']
  }
];

const securityComplianceSkills = [
  {
    name: 'GDPR Compliance',
    description: 'Expertise in implementing GDPR compliance requirements',
    category: SkillCategory.SECURITY_COMPLIANCE,
    tags: ['GDPR', 'compliance', 'data-protection', 'privacy']
  },
  {
    name: 'PCI DSS Compliance',
    description: 'Skill in implementing PCI DSS requirements for payment processing',
    category: SkillCategory.SECURITY_COMPLIANCE,
    tags: ['PCI-DSS', 'payment-security', 'compliance']
  }
];

const performanceOptimizationSkills = [
  {
    name: 'Performance Profiling',
    description: 'Ability to profile and optimize application performance',
    category: SkillCategory.PERFORMANCE_OPTIMIZATION,
    tags: ['performance', 'profiling', 'optimization', 'benchmarking']
  },
  {
    name: 'Caching Strategies',
    description: 'Expertise in implementing effective caching strategies',
    category: SkillCategory.PERFORMANCE_OPTIMIZATION,
    tags: ['caching', 'Redis', 'Memcached', 'performance']
  }
];

const devopsCloudSkills = [
  {
    name: 'Infrastructure as Code',
    description: 'Skill in managing infrastructure using code (Terraform, Pulumi)',
    category: SkillCategory.DEVOPS_CLOUD,
    tags: ['IaC', 'Terraform', 'Pulumi', 'infrastructure']
  },
  {
    name: 'Cloud Security',
    description: 'Expertise in implementing cloud security best practices',
    category: SkillCategory.DEVOPS_CLOUD,
    tags: ['cloud-security', 'IAM', 'security-groups', 'network-security']
  }
];

const generativeAISkills = [
  {
    name: 'Prompt Engineering',
    description: 'Skill in crafting effective prompts for generative AI models',
    category: SkillCategory.GENERATIVE_AI,
    tags: ['prompt-engineering', 'LLM', 'generative-AI']
  },
  {
    name: 'Fine-Tuning Models',
    description: 'Expertise in fine-tuning models for specific use cases',
    category: SkillCategory.GENERATIVE_AI,
    tags: ['fine-tuning', 'model-training', 'custom-models']
  }
];

// Combine all skills
const allSkills = [
  ...aiArchitectureSkills,
  ...backendInfrastructureSkills,
  ...fullstackMobileSkills,
  ...systemDesignSkills,
  ...productionDeploymentSkills,
  ...dataAnalyticsSkills,
  ...securityComplianceSkills,
  ...performanceOptimizationSkills,
  ...devopsCloudSkills,
  ...generativeAISkills
];

async function main(): Promise<void> {
  console.log('\u{1F331} Starting skills database seed...');

  // Clean existing skills
  await prisma.talentSkill.deleteMany();
  await prisma.castingCallSkill.deleteMany();
  await prisma.skill.deleteMany();

  console.log('\u{1F6E0} Cleaned existing skills data');

  // Create all skills
  for (const skillData of allSkills) {
    await prisma.skill.create({
      data: {
        name: skillData.name,
        description: skillData.description,
        category: skillData.category,
        tags: skillData.tags,
        isActive: true
      }
    });
  }

  console.log(`\u{2705} Created ${allSkills.length} skills`);
  
  // Link some skills to demo talents
  const talent1 = await prisma.user.findFirst({
    where: { email: 'emma.watson@bigstarz.com' },
    include: { talentProfile: true }
  });

  const talent2 = await prisma.user.findFirst({
    where: { email: 'ryan.gosling@bigstarz.com' },
    include: { talentProfile: true }
  });

  if (talent1?.talentProfile) {
    // Link some AI skills to talent1
    const aiSkills = await prisma.skill.findMany({
      where: { category: SkillCategory.AI_ARCHITECTURE },
      take: 3
    });
    
    for (const skill of aiSkills) {
      await prisma.talentSkill.create({
        data: {
          talentProfileId: talent1.talentProfile.id,
          skillId: skill.id,
          proficiency: SkillProficiency.ADVANCED,
          yearsExperience: 5
        }
      });
    }
  }

  if (talent2?.talentProfile) {
    // Link some backend skills to talent2
    const backendSkills = await prisma.skill.findMany({
      where: { category: SkillCategory.BACKEND_INFRASTRUCTURE },
      take: 3
    });
    
    for (const skill of backendSkills) {
      await prisma.talentSkill.create({
        data: {
          talentProfileId: talent2.talentProfile.id,
          skillId: skill.id,
          proficiency: SkillProficiency.EXPERT,
          yearsExperience: 8
        }
      });
    }
  }

  console.log('\u{2705} Linked skills to demo talents');
  console.log('\u{2705} Skills database seed completed successfully!');
}

main()
  .catch((e: Error) => {
    console.error('\u{274C} Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
