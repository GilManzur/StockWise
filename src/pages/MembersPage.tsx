/**
 * MembersPage — list and manage network members + roles.
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenantStore } from '@/state';
import { subscribeMembers, setMember, removeMember } from '@/services/firestore';
import type { MemberConfig, MemberRole } from '@/domain/network';
import { Plus, Users, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ROLE_COLORS: Record<MemberRole, string> = {
  network_admin: 'default',
  manager: 'secondary',
  viewer: 'outline',
};

export default function MembersPage() {
  const { activeNetworkId } = useTenantStore();
  const [members, setMembers] = useState<MemberConfig[]>([]);
  const [uid, setUid] = useState('');
  const [role, setRole] = useState<MemberRole>('viewer');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeNetworkId) return;
    const unsub = subscribeMembers(activeNetworkId, setMembers);
    return unsub;
  }, [activeNetworkId]);

  const handleAdd = async () => {
    if (!activeNetworkId || !uid.trim()) return;
    setSaving(true);
    try {
      await setMember(activeNetworkId, uid.trim(), role);
      toast({ title: 'Member added' });
      setUid('');
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!activeNetworkId) return;
    try {
      await setMember(activeNetworkId, memberId, newRole);
      toast({ title: 'Role updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!activeNetworkId) return;
    try {
      await removeMember(activeNetworkId, memberId);
      toast({ title: 'Member removed' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <TenantGuard requireLocation={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Members</h1>
              <p className="text-sm text-muted-foreground">Manage network access and roles</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Firebase UID</Label>
                    <Input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="User UID" />
                    <p className="text-xs text-muted-foreground">
                      Without an invite system, you must enter the user's Firebase UID directly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="network_admin">Network Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} disabled={saving || !uid.trim()} className="w-full">
                    {saving ? 'Saving…' : 'Add'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No members yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.uid}>
                      <TableCell className="font-mono text-sm">{m.uid}</TableCell>
                      <TableCell>
                        <Select
                          value={m.role}
                          onValueChange={(v) => handleRoleChange(m.uid, v as MemberRole)}
                        >
                          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="network_admin">Network Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(m.uid)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </TenantGuard>
    </DashboardLayout>
  );
}
