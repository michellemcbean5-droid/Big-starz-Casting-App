import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export interface ApplicationSubmitData {
  castingCallId: string;
  coverLetter?: string;
  videoUrl?: string;
  portfolioUrls?: string[];
}

export async function submitApplication(data: ApplicationSubmitData, talentId: string) {
  const castingCall = await prisma.castingCall.findUnique({
    where: { id: data.castingCallId },
  });

  if (!castingCall) {
    throw ApiError.notFound('Casting call not found');
  }

  if (castingCall.status !== 'OPEN') {
    throw ApiError.badRequest('This casting call is no longer accepting applications');
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      talentId_castingCallId: {
        talentId,
        castingCallId: data.castingCallId,
      },
    },
  });

  if (existingApplication) {
    throw ApiError.conflict('You have already applied to this casting call');
  }

  const notes = data.portfolioUrls && data.portfolioUrls.length > 0
    ? JSON.stringify({ portfolioUrls: data.portfolioUrls })
    : undefined;

  const application = await prisma.application.create({
    data: {
      talentId,
      castingCallId: data.castingCallId,
      coverLetter: data.coverLetter,
      videoUrl: data.videoUrl,
      notes,
      status: 'PENDING',
    },
    include: {
      castingCall: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      talent: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return application;
}

export async function listApplications(userId: string, userRole: string) {
  let where: Prisma.ApplicationWhereInput = {};

  if (userRole === 'TALENT') {
    where.talentId = userId;
  } else if (userRole === 'CASTING_DIRECTOR') {
    const directorCalls = await prisma.castingCall.findMany({
      where: { directorId: userId },
      select: { id: true },
    });

    const castingCallIds = directorCalls.map((c) => c.id);
    where.castingCallId = { in: castingCallIds };
  } else if (userRole === 'ADMIN') {
    where = {};
  } else {
    throw ApiError.forbidden('You do not have permission to view applications');
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      castingCall: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          location: true,
          directorId: true,
        },
      },
      talent: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return applications;
}

export async function getApplicationById(id: string, userId: string, userRole: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      castingCall: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          location: true,
          directorId: true,
          remoteOk: true,
          budget: true,
          deadline: true,
        },
      },
      talent: {
        select: {
          id: true,
          email: true,
          profile: {
            include: {
              talentProfile: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (userRole === 'TALENT' && application.talentId !== userId) {
    throw ApiError.forbidden('You can only view your own applications');
  }

  if (userRole === 'CASTING_DIRECTOR' && application.castingCall.directorId !== userId) {
    throw ApiError.forbidden('You can only view applications for your own casting calls');
  }

  return application;
}

export async function updateApplicationStatus(id: string, status: string, directorId: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      castingCall: {
        select: {
          directorId: true,
        },
      },
    },
  });

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (application.castingCall.directorId !== directorId) {
    throw ApiError.forbidden('You can only update applications for your own casting calls');
  }

  const validTransitions: Record<string, string[]> = {
    PENDING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED', 'HIRED'],
    SHORTLISTED: ['REJECTED', 'HIRED'],
    REJECTED: [],
    HIRED: [],
  };

  const currentStatus = application.status;
  const allowedNext = validTransitions[currentStatus] || [];

  if (!allowedNext.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status transition from ${currentStatus} to ${status}. ` +
      `Allowed transitions: ${allowedNext.join(', ') || 'none'}`
    );
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: status as any },
    include: {
      castingCall: {
        select: {
          id: true,
          title: true,
        },
      },
      talent: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return updated;
}

export async function withdrawApplication(id: string, talentId: string) {
  const application = await prisma.application.findUnique({
    where: { id },
  });

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (application.talentId !== talentId) {
    throw ApiError.forbidden('You can only withdraw your own applications');
  }

  if (application.status !== 'PENDING') {
    throw ApiError.badRequest(
      `Cannot withdraw application with status ${application.status}. Only PENDING applications can be withdrawn.`
    );
  }

  await prisma.application.delete({ where: { id } });

  return { id, withdrawn: true };
}
