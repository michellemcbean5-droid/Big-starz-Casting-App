import Joi from 'joi';
import { ApiError } from './ApiError';

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.message;
      return acc;
    }, {} as Record<string, string>);
    throw ApiError.badRequest('Validation failed', details);
  }
  return value;
}

export const castingCallCreateSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().trim(),
  description: Joi.string().min(1).max(5000).required(),
  type: Joi.string().valid('FILM', 'TV', 'COMMERCIAL', 'MUSIC_VIDEO', 'THEATER', 'DIGITAL').required(),
  location: Joi.string().max(200).optional().allow(''),
  remoteOk: Joi.boolean().optional().default(false),
  budget: Joi.number().min(0).optional(),
  compensation: Joi.string().max(500).optional().allow(''),
  deadline: Joi.date().optional().allow(null),
  requirements: Joi.object({
    skills: Joi.array().items(Joi.string()).optional(),
    location: Joi.string().optional().allow(''),
    unionStatus: Joi.string().valid('SAG_AFTRA', 'NON_UNION', 'EQUITY', 'AFTRA', 'OTHER').optional(),
    experienceYears: Joi.number().min(0).optional(),
    availability: Joi.string().optional().allow(''),
    ageMin: Joi.number().min(0).optional(),
    ageMax: Joi.number().min(0).optional(),
    gender: Joi.string().optional().allow(''),
    ethnicity: Joi.string().optional().allow(''),
    languages: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  roles: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      requirements: Joi.string().optional().allow(''),
    })
  ).optional(),
}).required();

export const castingCallUpdateSchema = castingCallCreateSchema.fork(
  ['title', 'description', 'type'],
  (schema) => schema.optional()
);

export const castingCallSearchSchema = Joi.object({
  search: Joi.string().optional().allow(''),
  type: Joi.string().valid('FILM', 'TV', 'COMMERCIAL', 'MUSIC_VIDEO', 'THEATER', 'DIGITAL').optional(),
  location: Joi.string().optional().allow(''),
  remote: Joi.boolean().optional(),
  budget_min: Joi.number().min(0).optional(),
  budget_max: Joi.number().min(0).optional(),
  status: Joi.string().valid('DRAFT', 'OPEN', 'CLOSED', 'FILLED').optional(),
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
  sort: Joi.string().valid('newest', 'oldest', 'budget_high', 'budget_low', 'deadline').optional().default('newest'),
});

export const applicationSubmitSchema = Joi.object({
  castingCallId: Joi.string().uuid().required(),
  coverLetter: Joi.string().max(5000).optional().allow(''),
  videoUrl: Joi.string().uri().optional().allow(''),
  portfolioUrls: Joi.array().items(Joi.string().uri()).optional(),
});

export const applicationStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED').required(),
});

export const talentSearchSchema = Joi.object({
  search: Joi.string().optional().allow(''),
  skills: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow(''),
  unionStatus: Joi.string().valid('SAG_AFTRA', 'NON_UNION', 'EQUITY', 'AFTRA', 'OTHER').optional(),
  ageMin: Joi.number().min(0).optional(),
  ageMax: Joi.number().min(0).optional(),
  featured: Joi.boolean().optional(),
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
});

export const matchRequestSchema = Joi.object({
  castingCallId: Joi.string().uuid().optional(),
  talentProfileId: Joi.string().uuid().optional(),
  limit: Joi.number().min(1).max(50).optional().default(10),
}).or('castingCallId', 'talentProfileId');
