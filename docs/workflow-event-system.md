# KEA Field Operations — Bidirectional Event-Driven Workflow System

This document is the production-ready implementation blueprint for the fully
automated, bidirectional workflow and tracker that spans the four dashboards:

| Role | Dashboard route | Workflow capability |
| --- | --- | --- |
| Super Admin | [`/admin`](../src/app/admin/page.tsx) | Create, approve, reject, message downstream |
| Supervisor | [`/supervisor`](../src/app/supervisor/page.tsx) | Review, request changes, escalate, message both ways |
| VSR | [`/vsr-operations`](../src/app/vsr-operations/page.tsx) | Create, track, message upstream |
| Merchandiser | [`/merchandiser`](../src/app/merchandiser/page.tsx) | Create, track, message upstream |

---

## 1. Architectural Overview

The repository is a **Next.js 16 App Router monolith** (not micro-frontends) with
a **shared Supabase backend** and two coexisting data layers:

1. **Supabase JS client** (JWT + RLS aware) — the canonical runtime data layer.
   Wired through [`src/lib/supabase-server.ts`](../src/lib/supabase-server.ts),
   [`src/lib/supabase.ts`](../src/lib/supabase.ts) and
   [`src/lib/db.ts`](../src/lib/db.ts).
2. **Drizzle + `pg` Pool** ([`src/db/index.ts`](../src/db/index.ts)) — a typed
   schema mirror used for migrations/type inference; nullable at runtime.

The workflow system maps onto this layout as follows:

```
┌────────────┐   POST/GET JSON    ┌─────────────────────────────┐
│  Dashboard  │ ─────────────────▶ │  Route Handlers (App Router) │
│ (React 19)  │  credentials:inc.  │  /api/workflows/...          │
│ WorkflowCenter / hooks           │  /api/documents  /api/alerts │
└────┬───────┘                     └──────────────┬──────────────┘
     │ Supabase Realtime                           │ requireRole() + RLS
     │ (postgres_changes) + 15s poll               │ domain layer
     ▼                                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                         │
│  workflows · workflow_steps · workflow_messages · alerts     │
│  audit_logs (trigger) · RLS policies · enum state machine    │
└─────────────────────────────────────────────────────────────┘
```

**State management** is a thin custom hook layer (no Redux/Zustand):
[`useWorkflowRealtime()`](../src/lib/use-workflow-realtime.ts),
[`useWorkflowStepsRealtime()`](../src/lib/use-workflow-realtime.ts) and
[`useWorkflowMessagesRealtime()`](../src/lib/use-workflow-realtime.ts). Each hook
subscribes to Supabase `postgres_changes` (WebSocket) **and** falls back to a 15 s
poll — the same dual mechanism as
[`useRealtimeAlerts()`](../src/lib/use-realtime-alerts.ts).

**Event-driven layer** — three sources of truth fan in:
- **Database** is the authoritative state machine (`workflow_steps` is the audit).
- **Supabase Realtime** broadcasts `INSERT/UPDATE` deltas to scoped clients.
- **Browser event bus** ([`shared-communications.ts`](../src/lib/shared-communications.ts))
  publishes `kea-workflow-created`, `kea-workflow-step-changed` and
  `kea-workflow-message-sent` for same-tab toasts + cross-tab dedupe.

---

## 2. Tier Routing Rules

### Tier 1 — Field → Management (VSR/Merchandiser ⇄ Supervisor)
- **Initiation:** `POST /api/workflows` with `originatorRole ∈ {vsr, merchandiser}`
  auto-resolves the assigned supervisor via
  [`resolveHierarchy()`](../src/lib/db.ts:501) and lands in
  `submitted_by_vsr` / `submitted_by_merchandiser`.
- **Response loop:** `POST /api/workflows/[id]/messages` enforces that field roles
  may only send `direction=upstream`; the recipient is always
  `workflow.assignedSupervisorId` (never a hardcoded user).
- **Supervisor acknowledgment:** `POST /api/workflows/[id]/supervisor-action`
  transitions the workflow to `under_supervisor_review` and can carry a
  `messageBody` that is routed **only** back to `workflow.originatorId`.

### Tier 2 — Management → Executive (Supervisor ⇄ Super Admin)
- **Initiation:** `POST /api/workflows` with `originatorRole = supervisor`
  auto-assigns the first `super_admin` and lands directly in `under_admin_review`
  (no manual escalation needed).
- **Governance:** `POST /api/workflows/[id]/admin-action` accepts
  `decision ∈ {approve, reject}`, fires a downstream `workflow_step`
  (`admin_action_approve` / `admin_action_reject`) and optionally a downstream
  message to `assignedSupervisorId`. A non-blocking Resend email is dispatched via
  [`sendSupervisorWorkflowDecisionEmail()`](../src/lib/email-service.ts).
- **Escalation (fallback):** `POST /api/workflows/[id]/escalate` moves a
  supervisor-owned workflow to `escalated_to_admin`.

### Tier 3 — Automated Tracker
Every mutation writes a row to `workflow_steps`; a Postgres trigger mirrors each
step into `audit_logs`. The UI renders the state machine:

```
draft → submitted_by_vsr / submitted_by_merchandiser
      → under_supervisor_review
      → escalated_to_admin / under_admin_review
      → approved | rejected | cancelled | retracted
```

---

## 3. Automated Tracker Schema

Tables are declared in [`src/db/schema.ts`](../src/db/schema.ts) and materialized
in [`supabase/schema.sql`](../supabase/schema.sql) plus migrations.

| Table | Purpose | Key columns |
| --- | --- | --- |
| `workflows` | Central request/upload/message record | `originator_id`, `originator_role`, `assigned_supervisor_id`, `assigned_admin_id`, `status`, `step_version` |
| `workflow_steps` | Immutable state-transition audit trail | `step_order`, `step_type`, `actor_id`, `actor_role`, `status_from`, `status_to`, `occurred_at` |
| `workflow_messages` | Bidirectional, scope-locked thread | `sender_id`, `target_user_id`, `direction`, `is_read`, `sent_at` |
| `alerts` | Instant cross-dashboard notification | `from_user_id`, `to_user_id`, `status`, `related_entity_type/id` |
| `audit_logs` | End-to-end governance log | `actor_id`, `entity_type`, `old_data`, `new_data` |

**Concurrency guard:** `workflows.step_version` is an optimistic-lock counter;
[`updateWorkflowStatus()`](../src/lib/db.ts:782) fails with
`WORKFLOW_STALE_STATE` (409) when a stale write races a newer transition.

**Enum hardening** (migration 002) added `pod_submission`,
`field_report_submission`, `alert_resolution` to `alert_type` and `pending`,
`reviewed`, `escalated` to `alert_status`, matching the event types the API layer
already emits.

---

## 4. Data Isolation & Security

- **Authentication:** every route calls
  [`requireRole()`](../src/lib/auth-helpers.ts:49) which resolves the Supabase
  session JWT and reads the canonical `public.users` role.
- **Scope guards:** [`getWorkflows()`](../src/lib/db.ts:537) and
  [`getWorkflowById()`](../src/lib/db.ts:570) enforce:
  - Super Admin → everything
  - Supervisor → `assigned_supervisor_id = self`
  - VSR/Merchandiser → `originator_id = self`
  - TSR → workflows whose supervisor reports to the TSR
- **RLS:** [`20260912000001_add_workflow_tables.sql`](../supabase/migrations/20260912000001_add_workflow_tables.sql)
  scopes `workflows`, `workflow_steps`, `workflow_messages`.
  [`20260912000002_workflow_governance.sql`](../supabase/migrations/20260912000002_workflow_governance.sql)
  adds Super Admin universal governance visibility and coherent policies for
  `users`, `alerts`, `documents`, `loans`, `leaves`, `outlets`. Helper functions
  `public.is_super_admin()` / `public.is_supervisor()` are `SECURITY DEFINER` to
  avoid recursive-RLS traps.

---

## 5. Implementation Blueprints — Precise Changes

### 5.1 Model / domain layer — [`src/lib/db.ts`](../src/lib/db.ts)
- Added [`supervisorActionWorkflow()`](../src/lib/db.ts:889) — Tier 1 review
  transition (`review` / `request_changes`).
- Added [`markWorkflowMessagesRead()`](../src/lib/db.ts:937) — read receipts for
  the thread unread counter.
- Existing `createWorkflow`, `escalateWorkflow`, `adminActionWorkflow`,
  `updateWorkflowStatus`, `resolveHierarchy` retained as the state machine core.

### 5.2 API routes
| Route | Change |
| --- | --- |
| [`src/app/api/workflows/route.ts`](../src/app/api/workflows/route.ts) | Supervisor-originated workflows now auto-assign `super_admin` and start in `under_admin_review` (Tier 2 direct upward routing) |
| [`src/app/api/workflows/[id]/supervisor-action/route.ts`](../src/app/api/workflows/[id]/supervisor-action/route.ts) | **New** — supervisor `review` / `request_changes` + optional downstream message |
| [`src/app/api/workflows/[id]/messages/read/route.ts`](../src/app/api/workflows/[id]/messages/read/route.ts) | **New** — mark thread read for current user |
| [`src/app/api/workflows/[id]/messages/route.ts`](../src/app/api/workflows/[id]/messages/route.ts) | Existing bidirectional routing by role (unchanged) |
| [`src/app/api/workflows/[id]/escalate/route.ts`](../src/app/api/workflows/[id]/escalate/route.ts) | Existing Tier 2 escalation (unchanged) |
| [`src/app/api/workflows/[id]/admin-action/route.ts`](../src/app/api/workflows/[id]/admin-action/route.ts) | Existing governance approve/reject (unchanged) |
| [`src/app/api/documents/route.ts`](../src/app/api/documents/route.ts) | Field uploads already auto-create a workflow + alert; enum values now valid via migration |

### 5.3 Frontend state management & UI
- Fixed the broken Supabase client import in
  [`use-workflow-realtime.ts`](../src/lib/use-workflow-realtime.ts) (`@/lib/supabase-client`
  → `@/lib/supabase`) and added `super-admin`/`admin` role normalization.
- Fixed event-payload bugs in
  [`shared-communications.ts`](../src/lib/shared-communications.ts)
  (`stepType`→`actorRole`, `direction`→`senderRole`).
- Fixed `justifyContent` and `m.sentAt` type bugs in
  [`workflow-messages-thread.tsx`](../src/components/workflow-messages-thread.tsx).
- Added [`WorkflowCenter`](../src/components/workflow-center.tsx) — a drop-in,
  role-aware workflow inbox (list + tracker + thread + role-scoped actions).
  Wire into any dashboard with:

```tsx
<WorkflowCenter actor={{ userId, role, name, supervisorId }} />
```

The Supervisor page already mounts the full workflow inbox at
[`src/app/supervisor/page.tsx`](../src/app/supervisor/page.tsx:124). Mount the same
`WorkflowCenter` on the VSR, Merchandiser, and Super Admin pages (inside their
existing `AppShell` content blocks) to complete all four surfaces without
duplicating logic.

### 5.4 Realtime event layer
- Supabase Realtime channels are declared in
  [`use-workflow-realtime.ts`](../src/lib/use-workflow-realtime.ts) for
  `workflows`, `workflow_steps`, and `workflow_messages`, scoped by the same RLS
  rules as the API (channel filters mirror the row-level filters).
- A 15 s polling fallback guarantees delivery when WebSockets are unavailable.

---

## 6. Git Plan

```
Modified
  src/lib/use-workflow-realtime.ts        # fix import + role normalization
  src/lib/shared-communications.ts        # fix event payload fields
  src/lib/db.ts                           # add supervisorActionWorkflow + markWorkflowMessagesRead
  src/app/api/workflows/route.ts          # Tier 2 auto-admin routing + type guards
  src/db/schema.ts                        # alert enums + sql import fix
  supabase/schema.sql                     # alert enums for fresh installs
  src/components/workflow-messages-thread.tsx  # justifyContent + sentAt fixes

Added
  src/app/api/workflows/[id]/supervisor-action/route.ts
  src/app/api/workflows/[id]/messages/read/route.ts
  src/components/workflow-center.tsx
  supabase/migrations/20260912000002_workflow_governance.sql
  docs/workflow-event-system.md

Deploy order
  1. Apply supabase migration 20260912000002_workflow_governance.sql
  2. Push app code
  3. Mount <WorkflowCenter/> on VSR / Merchandiser / Super Admin pages
```

**Suggested commit:**

```
feat(workflows): complete bidirectional event-driven workflow & governance tracker

- Add supervisor review/change-request transition and message read receipts
- Auto-route supervisor-initiated workflows to Super Admin (under_admin_review)
- Add governance migration: super-admin visibility, core-table RLS, enum hardening
- Fix realtime client import, role normalization, event payload and thread bugs
- Add reusable WorkflowCenter component for all four dashboards
```
