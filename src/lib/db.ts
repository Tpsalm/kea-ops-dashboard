import { createClient } from "./supabase-server";
import type {
  User, Outlet, Loan, Leave, Alert, Document, Client,
} from "@/db/schema";

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
