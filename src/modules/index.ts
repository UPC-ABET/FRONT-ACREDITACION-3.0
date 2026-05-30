export * from './academic';
export * from './accreditation';
export * from './auth';
export * from './core';
export * from './tests';
export * from './evaluation';
export * from './ifcs';

// LOADS modules (bulk uploads + Phase-0 configuration + history + canvas + capstone).
// Consumed via deep imports (@/modules/<m>/...) and each module's own index.ts barrel.
// Not re-exported through this root barrel on purpose: `export *` across feature modules
// is collision-prone (e.g. capstone's SubmitEvaluationPayload / useSubmitEvaluation clash
// with the existing evaluation module), and nothing imports from '@/modules' directly.
