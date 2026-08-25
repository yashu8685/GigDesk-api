import { relations } from 'drizzle-orm'
import { jobAssignments } from './job-assignments.js'
import { jobRequests } from './job-requests.js'
import { jobs } from './jobs.js'
import { notifications } from './notifications.js'
import { payouts } from './payouts.js'
import { eventLog } from './event-log.js'
import { users } from './users.js'

/**
 * All relations in one place so table files never import each other in
 * cycles. These power drizzle's relational query API (db.query.*).
 */

export const usersRelations = relations(users, ({ many }) => ({
  requests: many(jobRequests),
  assignments: many(jobAssignments),
  payouts: many(payouts),
  notifications: many(notifications),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
    relationName: 'jobs_created_by',
  }),
  assignedWorker: one(users, {
    fields: [jobs.assignedWorkerId],
    references: [users.id],
    relationName: 'jobs_assigned_worker',
  }),
  requests: many(jobRequests),
  assignments: many(jobAssignments),
  payouts: many(payouts),
  events: many(eventLog),
  notifications: many(notifications),
}))

export const jobRequestsRelations = relations(jobRequests, ({ one }) => ({
  job: one(jobs, { fields: [jobRequests.jobId], references: [jobs.id] }),
  worker: one(users, {
    fields: [jobRequests.workerId],
    references: [users.id],
    relationName: 'requests_worker',
  }),
  reviewedBy: one(users, {
    fields: [jobRequests.reviewedBy],
    references: [users.id],
    relationName: 'requests_reviewed_by',
  }),
}))

export const jobAssignmentsRelations = relations(jobAssignments, ({ one }) => ({
  job: one(jobs, { fields: [jobAssignments.jobId], references: [jobs.id] }),
  worker: one(users, {
    fields: [jobAssignments.workerId],
    references: [users.id],
    relationName: 'assignments_worker',
  }),
  assignedBy: one(users, {
    fields: [jobAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignments_assigned_by',
  }),
  request: one(jobRequests, {
    fields: [jobAssignments.requestId],
    references: [jobRequests.id],
  }),
}))

export const payoutsRelations = relations(payouts, ({ one }) => ({
  job: one(jobs, { fields: [payouts.jobId], references: [jobs.id] }),
  worker: one(users, {
    fields: [payouts.workerId],
    references: [users.id],
    relationName: 'payouts_worker',
  }),
}))

export const eventLogRelations = relations(eventLog, ({ one }) => ({
  job: one(jobs, { fields: [eventLog.jobId], references: [jobs.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  worker: one(users, {
    fields: [notifications.workerId],
    references: [users.id],
    relationName: 'notifications_worker',
  }),
  job: one(jobs, { fields: [notifications.jobId], references: [jobs.id] }),
}))
