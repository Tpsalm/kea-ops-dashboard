import { createClient } from "./supabase-server";
import type {
  User, Outlet, Loan, Leave, Alert, Document, Client,
  Workflow, WorkflowStep, WorkflowMessage,
} from "@/db/schema";

export class WorkflowError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Database query layer — all API routes go through here.
 * Uses the Supabase JS client (authenticated via the user's JWT).
 * This gives us RLS-aware queries with zero extra connection config.
 */

/* ──────────────── Users ──────────────── */

export async function getUsers(filters?: {
  role?: string;
  region?: string;
  clientId?: string;
  supervisorId?: string;
  status?: string;
}): Promise<User[]> {
  const supabase = await createClient();
  let query = supabase.from("users").select("*");
  if (filters?.role) query = query.eq("role", filters.role);
  if (filters?.region) query = query.eq("region", filters.region);
  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query.order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as User[];
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
  if (error) return null;
  return data as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
  if (error) return null;
  return data as User;
}

export async function createUser(userData: {
  email: string;
  name: string;
  role: string;
  phone?: string;
  region?: string;
  state?: string;
  lga?: string;
  territory?: string;
  supervisorId?: string;
  tsrId?: string;
  clientId?: string;
  status?: string;
}): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      region: userData.region,
      state: userData.state,
      lga: userData.lga,
      territory: userData.territory,
      supervisor_id: userData.supervisorId,
      tsr_id: userData.tsrId,
      client_id: userData.clientId,
      status: userData.status ?? "active",
      loan_debt: 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as User;
}

/* ──────────────── Outlets ──────────────── */

export async function getOutlets(filters?: {
  clientId?: string;
  supervisorId?: string;
  merchandiserId?: string;
  region?: string;
}): Promise<Outlet[]> {
  const supabase = await createClient();
  let query = supabase.from("outlets").select("*");
  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  if (filters?.merchandiserId) query = query.eq("merchandiser_id", filters.merchandiserId);
  if (filters?.region) query = query.eq("region", filters.region);
  const { data, error } = await query.order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Outlet[];
}

export async function createOutlet(outletData: {
  name: string;
  address?: string;
  region?: string;
  state?: string;
  lga?: string;
  territory?: string;
  type?: string;
  tier?: string;
  status?: string;
  merchandiserId?: string;
  supervisorId?: string;
  clientId?: string;
}): Promise<Outlet> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outlets")
    .insert({
      name: outletData.name,
      address: outletData.address,
      region: outletData.region,
      state: outletData.state,
      lga: outletData.lga,
      territory: outletData.territory,
      type: outletData.type ?? "wholesale",
      tier: outletData.tier ?? "silver",
      status: outletData.status ?? "healthy",
      merchandiser_id: outletData.merchandiserId,
      supervisor_id: outletData.supervisorId,
      client_id: outletData.clientId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Outlet;
}

/* ──────────────── Loans ──────────────── */

export async function getLoans(filters?: {
  vsrId?: string;
  status?: string;
  supervisorId?: string;
}): Promise<Loan[]> {
  const supabase = await createClient();
  let query = supabase.from("loans").select("*");
  if (filters?.vsrId) query = query.eq("vsr_id", filters.vsrId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Loan[];
}

export async function getLoanById(id: string): Promise<Loan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("loans").select("*").eq("id", id).single();
  if (error) return null;
  return data as Loan;
}

export async function createLoan(loanData: {
  vsrId: string;
  amount: number;
  purpose: string;
  supervisorId?: string;
  clientId?: string;
}): Promise<Loan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loans")
    .insert({
      vsr_id: loanData.vsrId,
      supervisor_id: loanData.supervisorId,
      client_id: loanData.clientId,
      amount: loanData.amount,
      purpose: loanData.purpose,
      status: "pending_supervisor",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Loan;
}

export async function updateLoan(
  id: string,
  updates: Partial<{
    status: string;
    supervisor_id: string;
    supervisor_review_date: string;
    supervisor_decision: string;
    supervisor_notes: string;
    admin_id: string;
    admin_review_date: string;
    admin_decision: string;
    admin_notes: string;
    disbursement_date: string;
    repayment_status: string;
    outstanding_balance: number;
  }>
): Promise<Loan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loans")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Loan;
}

/* ──────────────── Leaves ──────────────── */

export async function getLeaves(filters?: {
  staffId?: string;
  supervisorId?: string;
  status?: string;
}): Promise<Leave[]> {
  const supabase = await createClient();
  let query = supabase.from("leaves").select("*");
  if (filters?.staffId) query = query.eq("staff_id", filters.staffId);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Leave[];
}

export async function createLeave(leaveData: {
  staffId: string;
  supervisorId?: string;
  clientId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status?: string;
}): Promise<Leave> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaves")
    .insert({
      staff_id: leaveData.staffId,
      supervisor_id: leaveData.supervisorId,
      client_id: leaveData.clientId,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      reason: leaveData.reason,
      status: leaveData.status ?? "approved",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Update staff status to on_leave if current date is within range
  await supabase
    .from("users")
    .update({ status: "on_leave" })
    .eq("id", leaveData.staffId);

  return data as Leave;
}

export async function updateLeave(
  id: string,
  updates: Partial<{
    status: string;
    approved_by: string;
    approved_at: string;
  }>
): Promise<Leave> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaves")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Leave;
}

/* ──────────────── Alerts ──────────────── */

export async function getAlerts(filters?: {
  toUserId?: string;
  supervisorId?: string;
  status?: string;
  type?: string;
}): Promise<Alert[]> {
  const supabase = await createClient();
  let query = supabase.from("alerts").select("*");
  if (filters?.toUserId) query = query.eq("to_user_id", filters.toUserId);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.type) query = query.eq("type", filters.type);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Alert[];
}

export async function createAlert(alertData: {
  type: string;
  severity?: string;
  title: string;
  message: string;
  fromUserId: string;
  toUserId: string;
  supervisorId?: string;
  clientId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  status?: string;
}): Promise<Alert> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      type: alertData.type,
      severity: alertData.severity ?? "info",
      title: alertData.title,
      message: alertData.message,
      from_user_id: alertData.fromUserId,
      to_user_id: alertData.toUserId,
      supervisor_id: alertData.supervisorId,
      client_id: alertData.clientId,
      status: alertData.status ?? "pending_supervisor",
      related_entity_type: alertData.relatedEntityType,
      related_entity_id: alertData.relatedEntityId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Alert;
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("alerts").select("*").eq("id", id).single();
  if (error) return null;
  return data as Alert;
}

export async function updateAlert(
  id: string,
  updates: Partial<{
    status: string;
    reviewed_at: string;
    resolved_at: string;
    to_user_id: string;
  }>
): Promise<Alert> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Alert;
}

/* ──────────────── Documents ──────────────── */

export async function getDocuments(filters?: {
  uploaderId?: string;
  supervisorId?: string;
  status?: string;
  type?: string;
}): Promise<Document[]> {
  const supabase = await createClient();
  let query = supabase.from("documents").select("*");
  if (filters?.uploaderId) query = query.eq("uploader_id", filters.uploaderId);
  if (filters?.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.type) query = query.eq("type", filters.type);
  const { data, error } = await query.order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Document[];
}

export async function createDocument(docData: {
  uploaderId: string;
  supervisorId?: string;
  targetUserId?: string;
  clientId?: string;
  type: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  notes?: string;
}): Promise<Document> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      uploader_id: docData.uploaderId,
      supervisor_id: docData.supervisorId,
      target_user_id: docData.targetUserId,
      client_id: docData.clientId,
      type: docData.type,
      title: docData.title,
      file_url: docData.fileUrl,
      file_name: docData.fileName,
      notes: docData.notes,
      status: "pending_review",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Document;
}

/* ──────────────── KPI Aggregations ──────────────── */

export async function getAdminKPIs() {
  const supabase = await createClient();

  const [merchCount, outletCount, loanPendingAdminCount, loanActiveCount, loanFreeCount] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchandiser"),
    supabase.from("outlets").select("id", { count: "exact", head: true }),
    supabase.from("loans").select("id", { count: "exact", head: true }).eq("status", "pending_admin"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "vsr").gt("loan_debt", "0"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "vsr").eq("loan_debt", "0"),
  ]);

  return {
    totalMerchandisers: merchCount.count ?? 0,
    totalOutlets: outletCount.count ?? 0,
    dueForFunding: loanPendingAdminCount.count ?? 0,
    activeLoans: loanActiveCount.count ?? 0,
    noActiveLoans: loanFreeCount.count ?? 0,
  };
}

export async function getSupervisorKPIs(supervisorId: string) {
  const supabase = await createClient();

  const [merchTotal, merchActive, merchInactive, merchOnLeave, vsrTotal, vsrFunded, vsrNonFunded, outletTotal] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchandiser").eq("supervisor_id", supervisorId),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchandiser").eq("supervisor_id", supervisorId).eq("status", "active"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchandiser").eq("supervisor_id", supervisorId).eq("status", "inactive"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchandiser").eq("supervisor_id", supervisorId).eq("status", "on_leave"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "vsr").eq("supervisor_id", supervisorId),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "vsr").eq("supervisor_id", supervisorId).gt("loan_debt", "0"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "vsr").eq("supervisor_id", supervisorId).eq("loan_debt", "0"),
    supabase.from("outlets").select("id", { count: "exact", head: true }).eq("supervisor_id", supervisorId),
  ]);

  return {
    totalMerchandisers: merchTotal.count ?? 0,
    activeMerchandisers: merchActive.count ?? 0,
    inactiveMerchandisers: merchInactive.count ?? 0,
    onLeaveMerchandisers: merchOnLeave.count ?? 0,
    totalVSRs: vsrTotal.count ?? 0,
    fundedVSRs: vsrFunded.count ?? 0,
    nonFundedVSRs: vsrNonFunded.count ?? 0,
    totalOutlets: outletTotal.count ?? 0,
  };
}

/* ──────────────── Clients ──────────────── */

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

/* ──────────────── Workflows ──────────────── */

export interface WorkflowScopeUser {
  id: string;
  role: "super_admin" | "admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";
}

export interface WorkflowFilters {
  status?: string;
  clientId?: string;
  relatedEntityType?: string;
  limit?: number;
}

export async function resolveHierarchy(userId: string): Promise<{
  supervisorId: string | null;
  supervisorName: string | null;
  tsrId: string | null;
  adminId: string | null;
  adminName: string | null;
}> {
  const supabase = await createClient();
  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("supervisor_id, tsr_id")
    .eq("id", userId)
    .single();
  if (uErr || !user) {
    return { supervisorId: null, supervisorName: null, tsrId: null, adminId: null, adminName: null };
  }
  let supervisorName: string | null = null;
  if (user.supervisor_id) {
    const sup = await getUserById(user.supervisor_id);
    supervisorName = sup?.name ?? null;
  }
  const { data: admin, error: aErr } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  return {
    supervisorId: user.supervisor_id ?? null,
    supervisorName,
    tsrId: user.tsr_id ?? null,
    adminId: (!aErr && admin) ? admin.id : null,
    adminName: (!aErr && admin) ? admin.name : null,
  };
}

export async function getWorkflows(user: WorkflowScopeUser, filters?: WorkflowFilters): Promise<Workflow[]> {
  const supabase = await createClient();
  let query = supabase.from("workflows").select("*");
  switch (user.role) {
    case "super_admin":
    case "admin":
      break;
    case "supervisor":
      query = query.eq("assigned_supervisor_id", user.id);
      break;
    case "vsr":
    case "merchandiser":
      query = query.eq("originator_id", user.id);
      break;
    case "tsr": {
      const { data: sups, error } = await supabase
        .from("users")
        .select("id")
        .eq("tsr_id", user.id);
      const supIds = (!error && sups) ? sups.map((s: any) => s.id) : ["__none__"];
      query = query.in("assigned_supervisor_id", supIds);
      break;
    }
  }
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.relatedEntityType) query = query.eq("related_entity_type", filters.relatedEntityType);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new WorkflowError(error.message, "DB_ERROR", 500);
  return (data ?? []) as Workflow[];
}

export async function getWorkflowById(id: string, requireUser: WorkflowScopeUser): Promise<Workflow> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workflows").select("*").eq("id", id).single();
  if (error || !data) throw new WorkflowError("Workflow not found", "WORKFLOW_NOT_FOUND", 404);
  const wf = data as Workflow;
  let inScope = false;
  switch (requireUser.role) {
    case "super_admin":
    case "admin":
      inScope = true;
      break;
    case "supervisor":
      inScope = wf.assignedSupervisorId === requireUser.id;
      break;
    case "vsr":
    case "merchandiser":
      inScope = wf.originatorId === requireUser.id;
      break;
    case "tsr": {
      if (wf.assignedSupervisorId) {
        const sup = await getUserById(wf.assignedSupervisorId);
        inScope = !!sup && sup.tsrId === requireUser.id;
      }
      break;
    }
  }
  if (!inScope) throw new WorkflowError("Outside workflow access scope", "FORBIDDEN_SCOPE", 403);
  return wf;
}

export async function createWorkflow(payload: {
  originatorId: string;
  originatorRole: Workflow["originatorRole"];
  assignedSupervisorId: string;
  assignedAdminId?: string | null;
  clientId?: string | null;
  status?: Workflow["status"];
  title: string;
  summary?: string | null;
  priority?: number;
  documentIds?: string[];
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  actorNameForStep?: string;
}): Promise<{ workflow: Workflow; initialSteps: WorkflowStep[] }> {
  const supabase = await createClient();
  const status = payload.status ?? "draft";
  const insertData: Record<string, any> = {
    originator_id: payload.originatorId,
    originator_role: payload.originatorRole,
    assigned_supervisor_id: payload.assignedSupervisorId,
    status,
    title: payload.title,
    summary: payload.summary ?? null,
    priority: payload.priority ?? 1,
    document_ids: payload.documentIds ?? [],
    step_version: 0,
  };
  if (payload.assignedAdminId) insertData.assigned_admin_id = payload.assignedAdminId;
  if (payload.clientId) insertData.client_id = payload.clientId;
  if (payload.relatedEntityType) insertData.related_entity_type = payload.relatedEntityType;
  if (payload.relatedEntityId) insertData.related_entity_id = payload.relatedEntityId;

  const { data: wfData, error: wfErr } = await supabase
    .from("workflows")
    .insert([insertData])
    .select()
    .single();
  if (wfErr || !wfData) {
    throw new WorkflowError(wfErr?.message ?? "Failed to create workflow", "DB_ERROR", 500);
  }
  const workflow = wfData as Workflow;
  const steps: WorkflowStep[] = [];

  try {
    const { data: s1, error: s1Err } = await supabase
      .from("workflow_steps")
      .insert([{
        workflow_id: workflow.id,
        step_order: 1,
        step_type: "create",
        actor_id: payload.originatorId,
        actor_role: payload.originatorRole,
        title: "Draft Created",
        description: `Workflow created by ${payload.actorNameForStep ?? payload.originatorRole}`,
        status_from: null,
        status_to: "draft",
      }])
      .select()
      .single();
    if (s1Err) throw s1Err;
    steps.push(s1 as WorkflowStep);

    if (status !== "draft") {
      const submitType = status === "submitted_by_vsr" ? "submitted_by_vsr" : "submitted_by_merchandiser";
      const submitTitle = submitType === "submitted_by_vsr" ? "Submitted by VSR" : "Submitted by Merchandiser";
      const { data: s2, error: s2Err } = await supabase
        .from("workflow_steps")
        .insert([{
          workflow_id: workflow.id,
          step_order: 2,
          step_type: "submit",
          actor_id: payload.originatorId,
          actor_role: payload.originatorRole,
          title: submitTitle,
          description: payload.summary ?? null,
          status_from: "draft",
          status_to: submitType,
        }])
        .select()
        .single();
      if (s2Err) throw s2Err;
      steps.push(s2 as WorkflowStep);
    }
  } catch (stepErr: any) {
    await supabase.from("workflows").delete().eq("id", workflow.id);
    throw new WorkflowError(stepErr?.message ?? "Failed to attach steps", "DB_ERROR", 500);
  }
  return { workflow, initialSteps: steps };
}

export async function createWorkflowStep(payload: {
  workflowId: string;
  stepOrder?: number;
  stepType: WorkflowStep["stepType"];
  actorId: string;
  actorRole: WorkflowStep["actorRole"];
  title: string;
  description?: string | null;
  statusFrom?: WorkflowStep["statusFrom"] | null;
  statusTo?: WorkflowStep["statusTo"] | null;
  metadata?: Record<string, any> | null;
}): Promise<WorkflowStep> {
  const supabase = await createClient();
  let stepOrder = payload.stepOrder;
  if (!stepOrder) {
    const { data: lastStep, error: lastErr } = await supabase
      .from("workflow_steps")
      .select("step_order")
      .eq("workflow_id", payload.workflowId)
      .order("step_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    stepOrder = (!lastErr && lastStep) ? (Number(lastStep.step_order) + 1) : 1;
  }
  const { data, error } = await supabase
    .from("workflow_steps")
    .insert([{
      workflow_id: payload.workflowId,
      step_order: stepOrder,
      step_type: payload.stepType,
      actor_id: payload.actorId,
      actor_role: payload.actorRole,
      title: payload.title,
      description: payload.description ?? null,
      status_from: payload.statusFrom ?? null,
      status_to: payload.statusTo ?? null,
      metadata: payload.metadata ?? null,
    }])
    .select()
    .single();
  if (error || !data) throw new WorkflowError(error?.message ?? "Step insert failed", "DB_ERROR", 500);
  return data as WorkflowStep;
}

export async function getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("step_order", { ascending: true });
  if (error) throw new WorkflowError(error.message, "DB_ERROR", 500);
  return (data ?? []) as WorkflowStep[];
}

export async function createWorkflowMessage(payload: {
  workflowId: string;
  senderId: string;
  targetUserId: string;
  direction: WorkflowMessage["direction"];
  body: string;
  attachmentUrl?: string | null;
}): Promise<WorkflowMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_messages")
    .insert([{
      workflow_id: payload.workflowId,
      sender_id: payload.senderId,
      target_user_id: payload.targetUserId,
      direction: payload.direction,
      body: payload.body,
      attachment_url: payload.attachmentUrl ?? null,
    }])
    .select()
    .single();
  if (error || !data) throw new WorkflowError(error?.message ?? "Message insert failed", "DB_ERROR", 500);
  return data as WorkflowMessage;
}

export async function getWorkflowMessages(workflowId: string): Promise<WorkflowMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_messages")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("sent_at", { ascending: true });
  if (error) throw new WorkflowError(error.message, "DB_ERROR", 500);
  return (data ?? []) as WorkflowMessage[];
}

export async function updateWorkflowStatus(params: {
  id: string;
  newStatus: Workflow["status"];
  expectedStepVersion: number;
}): Promise<Workflow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .update({
      status: params.newStatus,
      step_version: params.expectedStepVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("step_version", params.expectedStepVersion)
    .select()
    .single();
  if (error || !data) {
    throw new WorkflowError(
      "Workflow state has changed — please refresh and try again",
      "WORKFLOW_STALE_STATE",
      409,
    );
  }
  return data as Workflow;
}

export async function escalateWorkflow(id: string, supervisorUser: WorkflowScopeUser, supervisorName?: string): Promise<{ workflow: Workflow; step: WorkflowStep }> {
  const supabase = await createClient();
  const { data: wfRaw, error: wfErr } = await supabase.from("workflows").select("*").eq("id", id).single();
  if (wfErr || !wfRaw) throw new WorkflowError("Workflow not found", "WORKFLOW_NOT_FOUND", 404);
  const wf = wfRaw as Workflow;
  if (wf.assignedSupervisorId !== supervisorUser.id) {
    throw new WorkflowError("Escalation allowed only for assigned supervisor", "FORBIDDEN_SCOPE", 403);
  }
  const { data: admin, error: aErr } = await supabase
    .from("users")
    .select("id, name")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  if (aErr || !admin) {
    throw new WorkflowError("No super_admin user available for escalation", "HIERARCHY_MISSING_ADMIN", 422);
  }
  const updated = await updateWorkflowStatus({
    id,
    newStatus: "escalated_to_admin",
    expectedStepVersion: Number(wf.stepVersion),
  });
  const { data: upd2 } = await supabase
    .from("workflows")
    .update({ assigned_admin_id: admin.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  const finalWorkflow = (upd2 ?? updated) as Workflow;
  const step = await createWorkflowStep({
    workflowId: id,
    stepType: "escalate",
    actorId: supervisorUser.id,
    actorRole: supervisorUser.role as any,
    title: "Escalated to Super Admin",
    description: `Escalated by ${supervisorName ?? "Supervisor"} to ${admin.name}`,
    statusFrom: wf.status as any,
    statusTo: "escalated_to_admin",
  });
  return { workflow: finalWorkflow, step };
}

export async function adminActionWorkflow(params: {
  id: string;
  adminUser: WorkflowScopeUser;
  decision: "approve" | "reject";
  notes?: string | null;
  adminName?: string;
}): Promise<{ workflow: Workflow; step: WorkflowStep }> {
  const supabase = await createClient();
  const { data: wfRaw, error: wfErr } = await supabase.from("workflows").select("*").eq("id", params.id).single();
  if (wfErr || !wfRaw) throw new WorkflowError("Workflow not found", "WORKFLOW_NOT_FOUND", 404);
  const wf = wfRaw as Workflow;
  const newStatus = params.decision === "approve" ? "approved" : "rejected";
  const stepType = params.decision === "approve" ? "admin_action_approve" : "admin_action_reject";
  const stepTitle = params.decision === "approve" ? "Admin Decision: Approved" : "Admin Decision: Rejected";
  const updated = await updateWorkflowStatus({
    id: params.id,
    newStatus: newStatus as any,
    expectedStepVersion: Number(wf.stepVersion),
  });
  const step = await createWorkflowStep({
    workflowId: params.id,
    stepType: stepType as any,
    actorId: params.adminUser.id,
    actorRole: params.adminUser.role as any,
    title: stepTitle,
    description: params.notes ?? null,
    statusFrom: wf.status as any,
    statusTo: newStatus as any,
  });
  return { workflow: updated, step };
}

/**
 * Supervisor review transition (Tier 1 response loop).
 * Moves a field-submitted workflow into `under_supervisor_review` so the
 * tracker reflects "Under Supervisor Review" before escalation. Optionally
 * recorded as a change-request review without altering the state machine.
 */
export async function supervisorActionWorkflow(params: {
  id: string;
  supervisorUser: WorkflowScopeUser;
  action: "review" | "request_changes";
  notes?: string | null;
  supervisorName?: string;
}): Promise<{ workflow: Workflow; step: WorkflowStep }> {
  const supabase = await createClient();
  const { data: wfRaw, error: wfErr } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", params.id)
    .single();
  if (wfErr || !wfRaw) throw new WorkflowError("Workflow not found", "WORKFLOW_NOT_FOUND", 404);
  const wf = wfRaw as Workflow;

  if (wf.assignedSupervisorId !== params.supervisorUser.id) {
    throw new WorkflowError("Review allowed only for assigned supervisor", "FORBIDDEN_SCOPE", 403);
  }

  const allowedFrom = ["submitted_by_vsr", "submitted_by_merchandiser", "under_supervisor_review"];
  if (!allowedFrom.includes(wf.status)) {
    throw new WorkflowError(`Cannot review from status "${wf.status}"`, "INVALID_STATE", 409);
  }

  const newStatus: Workflow["status"] = "under_supervisor_review";
  const updated = await updateWorkflowStatus({
    id: params.id,
    newStatus,
    expectedStepVersion: Number(wf.stepVersion),
  });

  const step = await createWorkflowStep({
    workflowId: params.id,
    stepType: "review",
    actorId: params.supervisorUser.id,
    actorRole: params.supervisorUser.role as any,
    title: params.action === "request_changes" ? "Changes Requested by Supervisor" : "Under Supervisor Review",
    description: params.notes ?? null,
    statusFrom: wf.status as any,
    statusTo: newStatus as any,
  });
  return { workflow: updated, step };
}

/**
 * Marks every unread message in a workflow thread as read for the current user.
 */
export async function markWorkflowMessagesRead(workflowId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_messages")
    .update({ is_read: true })
    .eq("workflow_id", workflowId)
    .eq("target_user_id", userId)
    .eq("is_read", false);
  if (error) throw new WorkflowError(error.message, "DB_ERROR", 500);
}
