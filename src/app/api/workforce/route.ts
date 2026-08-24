import { NextResponse } from 'next/server';
import { staff } from '@/app/data';

// Simple server-side RBAC simulation. In production replace with real auth
// middleware that validates the requestor's JWT/session and derives roles + client ids.
export async function GET(request: Request) {
  // Read simulated headers set by the client-side fetch
  const role = request.headers.get('x-user-role') || 'admin';
  const clientIdsHeader = request.headers.get('x-client-ids') || '';
  const allowedClientIds = clientIdsHeader ? clientIdsHeader.split(',').map(s => s.trim()) : [];

  let filtered = staff.slice();

  // If the requester is a client, only return rows matching allowed client ids
  if (role === 'client') {
    filtered = filtered.filter(s => s.clientId && allowedClientIds.includes(s.clientId));
  }

  // Return staff rows and simple derived metadata (could be extended)
  return NextResponse.json({ staff: filtered, count: filtered.length });
}
