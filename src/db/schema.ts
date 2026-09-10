import {
  pgTable, uuid, text, numeric, doublePrecision, timestamp, date, pgEnum, bigint, jsonb
} from "drizzle-orm/pg-core";

/* ──────────────────── ENUMS ──────────────────── */

export const userRoleEnum = pgEnum("user_role", [
  "super_admin", "supervisor", "vsr", "merchandiser", "tsr",
]);
export const userStatusEnum = pgEnum("user_status", [
  "active", "inactive", "on_leave",
]);
export const loanStatusEnum = pgEnum("loan_status", [
  "draft", "pending_supervisor", "pending_admin", "approved", "rejected", "disbursed",
]);
export const leaveStatusEnum = pgEnum("leave_status", [
  "pending", "approved", "rejected",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "funding_request", "leave_request", "document_upload",
  "performance_review", "system_event",
]);
export const alertSeverityEnum = pgEnum("alert_severity", [
  "info", "warning", "critical",
]);
export const alertStatusEnum = pgEnum("alert_status", [
  "pending_supervisor", "pending_admin", "resolved", "rejected", "pending", "reviewed", "escalated"
]);
export const documentTypeEnum = pgEnum("document_type", [
  "pod_tracker", "performance_report",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending_review", "reviewed", "escalated",
]);
export const outletTypeEnum = pgEnum("outlet_type", [
  "supermarket", "convenience", "wholesale", "pharmacy", "horeca", "kiosk",
]);
export const outletTierEnum = pgEnum("outlet_tier", [
  "platinum", "gold", "silver", "bronze",
]);
export const outletStatusEnum = pgEnum("outlet_status", [
  "healthy", "needs_review", "inactive",
]);

/* ──────────────────── TABLES ──────────────────── */

export const clients = pgTable("clients", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  sector:    text("sector"),
  code:      text("code"),
  status:    text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  authId:        uuid("auth_id"),
  email:         text("email").unique().notNull(),
  name:          text("name").notNull(),
  role:          userRoleEnum("role").notNull(),
  status:        userStatusEnum("status").default("active"),
  phone:         text("phone"),
  region:        text("region"),
  state:         text("state"),
  lga:           text("lga"),
  territory:     text("territory"),
  supervisorId:  uuid("supervisor_id").references((): any => users.id),
  tsrId:         uuid("tsr_id").references((): any => users.id),
  clientId:      uuid("client_id").references(() => clients.id),
  loanDebt:      numeric("loan_debt", { precision: 14, scale: 2 }).default("0"),
  meta:          jsonb("meta").default({}),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const outlets = pgTable("outlets", {
  id:              uuid("id").primaryKey().defaultRandom(),
  name:            text("name").notNull(),
  address:         text("address"),
  region:          text("region"),
  state:           text("state"),
  lga:             text("lga"),
  territory:       text("territory"),
  lat:             doublePrecision("lat"),
  lng:             doublePrecision("lng"),
  type:            outletTypeEnum("type").default("wholesale"),
  tier:            outletTierEnum("tier").default("silver"),
  status:          outletStatusEnum("status").default("healthy"),
  merchandiserId:  uuid("merchandiser_id").references(() => users.id),
  supervisorId:    uuid("supervisor_id").references(() => users.id),
  clientId:        uuid("client_id").references(() => clients.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const loans = pgTable("loans", {
  id:                    uuid("id").primaryKey().defaultRandom(),
  clientId:              uuid("client_id").references(() => clients.id),
  vsrId:                 uuid("vsr_id").notNull().references(() => users.id),
  supervisorId:          uuid("supervisor_id").references(() => users.id),
  adminId:               uuid("admin_id").references(() => users.id),
  amount:                numeric("amount", { precision: 14, scale: 2 }).notNull(),
  purpose:               text("purpose").notNull(),
  status:                loanStatusEnum("status").default("pending_supervisor"),
  supervisorDecision:    text("supervisor_decision"),
  supervisorNotes:       text("supervisor_notes"),
  supervisorReviewDate:  timestamp("supervisor_review_date", { withTimezone: true }),
  adminDecision:         text("admin_decision"),
  adminNotes:            text("admin_notes"),
  adminReviewDate:       timestamp("admin_review_date", { withTimezone: true }),
  disbursementDate:      timestamp("disbursement_date", { withTimezone: true }),
  repaymentStatus:       text("repayment_status").default("unpaid"),
  outstandingBalance:    numeric("outstanding_balance", { precision: 14, scale: 2 }).default("0"),
  applicationDate:       timestamp("application_date", { withTimezone: true }).defaultNow(),
  createdAt:             timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:             timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const leaves = pgTable("leaves", {
  id:           uuid("id").primaryKey().defaultRandom(),
  clientId:     uuid("client_id").references(() => clients.id),
  staffId:      uuid("staff_id").notNull().references(() => users.id),
  supervisorId: uuid("supervisor_id").references(() => users.id),
  startDate:    date("start_date").notNull(),
  endDate:      date("end_date").notNull(),
  reason:       text("reason").notNull(),
  status:       leaveStatusEnum("status").default("approved"),
  approvedBy:   uuid("approved_by").references(() => users.id),
  approvedAt:   timestamp("approved_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const documents = pgTable("documents", {
  id:            uuid("id").primaryKey().defaultRandom(),
  clientId:      uuid("client_id").references(() => clients.id),
  uploaderId:    uuid("uploader_id").notNull().references(() => users.id),
  supervisorId:  uuid("supervisor_id").references(() => users.id),
  targetUserId:  uuid("target_user_id").references(() => users.id),
  type:          documentTypeEnum("type").notNull(),
  title:         text("title").notNull(),
  fileUrl:       text("file_url").notNull(),
  fileName:      text("file_name"),
  fileSize:      bigint("file_size", { mode: "number" }),
  mimeType:      text("mime_type"),
  status:        documentStatusEnum("status").default("pending_review"),
  notes:         text("notes"),
  uploadedAt:    timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

export const alerts = pgTable("alerts", {
  id:                uuid("id").primaryKey().defaultRandom(),
  clientId:          uuid("client_id").references(() => clients.id),
  type:              alertTypeEnum("type").notNull(),
  severity:          alertSeverityEnum("severity").default("info"),
  title:             text("title").notNull(),
  message:           text("message").notNull(),
  fromUserId:        uuid("from_user_id").notNull().references(() => users.id),
  toUserId:          uuid("to_user_id").notNull().references(() => users.id),
  supervisorId:      uuid("supervisor_id").references(() => users.id),
  status:            alertStatusEnum("status").default("pending_supervisor"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId:   uuid("related_entity_id"),
  metadata:          jsonb("metadata").default({}),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow(),
  reviewedAt:        timestamp("reviewed_at", { withTimezone: true }),
  resolvedAt:        timestamp("resolved_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id:         uuid("id").primaryKey().defaultRandom(),
  actorId:    uuid("actor_id").references(() => users.id),
  action:     text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId:   uuid("entity_id").notNull(),
  oldData:    jsonb("old_data"),
  newData:    jsonb("new_data"),
  ipAddress:  text("ip_address"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ──────────────────── TYPE EXPORTS ──────────────────── */

export type Client = typeof clients.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Outlet = typeof outlets.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type Leave = typeof leaves.$inferSelect;
export type NewLeave = typeof leaves.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
