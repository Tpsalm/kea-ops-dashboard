import {
  pgTable, uuid, text, numeric, doublePrecision, timestamp, date, pgEnum,
} from "drizzle-orm/pg-core";

/* ──────────────────── ENUMS ──────────────────── */

export const userRoleEnum = pgEnum("user_role", [
  "super_admin", "supervisor", "vsr", "merchandiser", "tsr",
]);
export const userStatusEnum = pgEnum("user_status", [
  "active", "inactive", "on_leave",
]);
export const loanStatusEnum = pgEnum("loan_status", [
  "pending_supervisor", "pending_admin", "approved", "rejected", "disbursed",
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
  "pending", "reviewed", "escalated", "resolved",
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
  status:    text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
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
  loanDebt:      numeric("loan_debt", { precision: 12, scale: 2 }).default("0"),
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
  type:            outletTypeEnum("type"),
  tier:            outletTierEnum("tier"),
  status:          outletStatusEnum("status").default("healthy"),
  merchandiserId:  uuid("merchandiser_id").references(() => users.id),
  supervisorId:    uuid("supervisor_id").references(() => users.id),
  clientId:        uuid("client_id").references(() => clients.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const loans = pgTable("loans", {
  id:                    uuid("id").primaryKey().defaultRandom(),
  vsrId:                 uuid("vsr_id").notNull().references(() => users.id),
  amount:                numeric("amount", { precision: 12, scale: 2 }).notNull(),
  purpose:               text("purpose"),
  status:                loanStatusEnum("status").default("pending_supervisor"),
  applicationDate:       timestamp("application_date", { withTimezone: true }).defaultNow(),
  supervisorId:          uuid("supervisor_id").references(() => users.id),
  supervisorReviewDate:  timestamp("supervisor_review_date", { withTimezone: true }),
  supervisorNotes:       text("supervisor_notes"),
  adminId:               uuid("admin_id").references(() => users.id),
  adminReviewDate:       timestamp("admin_review_date", { withTimezone: true }),
  adminNotes:            text("admin_notes"),
  disbursementDate:      timestamp("disbursement_date", { withTimezone: true }),
  repaymentStatus:       text("repayment_status").default("none"),
  outstandingBalance:    numeric("outstanding_balance", { precision: 12, scale: 2 }).default("0"),
  createdAt:             timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:             timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const leaves = pgTable("leaves", {
  id:          uuid("id").primaryKey().defaultRandom(),
  staffId:     uuid("staff_id").notNull().references(() => users.id),
  startDate:   date("start_date").notNull(),
  endDate:     date("end_date").notNull(),
  reason:      text("reason"),
  status:      leaveStatusEnum("status").default("pending"),
  approvedBy:  uuid("approved_by").references(() => users.id),
  approvedAt:  timestamp("approved_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const alerts = pgTable("alerts", {
  id:               uuid("id").primaryKey().defaultRandom(),
  type:             alertTypeEnum("type").notNull(),
  severity:         alertSeverityEnum("severity").default("info"),
  title:            text("title").notNull(),
  message:          text("message"),
  fromUserId:       uuid("from_user_id").notNull().references(() => users.id),
  toUserId:         uuid("to_user_id").notNull().references(() => users.id),
  supervisorId:     uuid("supervisor_id").references(() => users.id),
  status:           alertStatusEnum("status").default("pending"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId:  uuid("related_entity_id"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow(),
  reviewedAt:       timestamp("reviewed_at", { withTimezone: true }),
  resolvedAt:       timestamp("resolved_at", { withTimezone: true }),
});

export const documents = pgTable("documents", {
  id:            uuid("id").primaryKey().defaultRandom(),
  uploaderId:    uuid("uploader_id").notNull().references(() => users.id),
  supervisorId:  uuid("supervisor_id").references(() => users.id),
  type:          documentTypeEnum("type").notNull(),
  title:         text("title").notNull(),
  fileUrl:       text("file_url").notNull(),
  fileName:      text("file_name"),
  status:        documentStatusEnum("status").default("pending_review"),
  notes:         text("notes"),
  uploadedAt:    timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
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
