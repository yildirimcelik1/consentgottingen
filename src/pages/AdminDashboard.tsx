import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, FilePlus, FileCheck, Loader2, UserPlus, Search, Trash2, Download, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Profile, ConsentForm } from '@/types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('designer');
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchForms, setSearchForms] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Artists state
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [newArtistName, setNewArtistName] = useState('');
  const [addingArtist, setAddingArtist] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, formsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('consent_forms').select('*').order('created_at', { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as unknown as Profile[]);
    if (formsRes.data) setForms(formsRes.data as unknown as ConsentForm[]);

    // Load artists from profiles with designer or piercer role
    if (profilesRes.data) {
      const activeArtists = (profilesRes.data as unknown as Profile[])
        .filter(p => p.role === 'designer' || p.role === 'piercer' || p.role === 'tattoo_artist')
        .map(p => ({ id: p.id, name: p.full_name }));
      setArtists(activeArtists);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword || !inviteRole) {
      toast({ title: 'Fehler', description: 'Alle Felder sind erforderlich.', variant: 'destructive' });
      return;
    }
    if (invitePassword.length < 6) {
      toast({ title: 'Fehler', description: 'Passwort muss mindestens 6 Zeichen lang sein.', variant: 'destructive' });
      return;
    }
    if (invitePassword !== invitePasswordConfirm) {
      toast({ title: 'Fehler', description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, password: invitePassword, full_name: inviteName, role: inviteRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Benutzer erstellt', description: `${inviteEmail} wurde erfolgreich hinzugefügt.` });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setInvitePasswordConfirm('');
      setInviteRole('designer');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erstellung fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    setInviting(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Benutzer gelöscht' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Löschen fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    setDeletingId(null);
  };

  const handleDeleteForm = async (formId: string) => {
    const { error } = await supabase.from('consent_forms').delete().eq('id', formId);
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Formular gelöscht' });
      fetchData();
    }
  };

  const totalUsers = profiles.length;
  const totalForms = forms.length;
  const draftForms = forms.filter(f => f.status === 'draft').length;
  const approvedForms = forms.filter(f => f.status === 'approved').length;

  const filteredUsers = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      p.email.toLowerCase().includes(searchUsers.toLowerCase());
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredForms = forms.filter(f => {
    const matchSearch = f.first_name.toLowerCase().includes(searchForms.toLowerCase()) ||
      f.last_name.toLowerCase().includes(searchForms.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin-Übersicht</h1>
          <p className="text-muted-foreground text-sm mt-1">Systemübersicht und Verwaltung</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Benutzer insgesamt</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? '—' : totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Einverständnisbögen</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? '—' : totalForms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entwürfe</CardTitle>
              <FilePlus className="h-4 w-4 text-status-draft" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? '—' : draftForms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Genehmigte Formulare</CardTitle>
              <FileCheck className="h-4 w-4 text-status-approved" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? '—' : approvedForms}</p>
            </CardContent>
          </Card>
        </div>


        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Benutzer</CardTitle>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" />Benutzer hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Vollständiger Name</Label>
                    <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Vollständiger Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@studio.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Mindestens 6 Zeichen" />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort bestätigen</Label>
                    <Input type="password" value={invitePasswordConfirm} onChange={e => setInvitePasswordConfirm(e.target.value)} placeholder="Passwort erneut eingeben" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rolle</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="piercer">Piercer</SelectItem>
                        <SelectItem value="tattoo_artist">Tattoo Artist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={inviting}>
                    {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Benutzer erstellen
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Benutzer suchen..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Rolle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="piercer">Piercer</SelectItem>
                  <SelectItem value="tattoo_artist">Tattoo Artist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Keine Benutzer gefunden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vollständiger Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Beitritt</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-0">
                          {u.role === 'admin' ? 'Admin' : u.role === 'piercer' ? 'Piercer' : u.role === 'tattoo_artist' ? 'Tattoo Artist' : 'Designer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={u.is_active ? 'bg-primary text-primary-foreground border-0' : 'bg-secondary text-secondary-foreground border-0'}>
                          {u.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        {u.id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchten Sie <strong>{u.full_name}</strong> ({u.email}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Consent Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Einverständnisbögen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Nach Kundenname suchen..." value={searchForms} onChange={e => setSearchForms(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="approved">Genehmigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredForms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Keine Formulare gefunden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                      <TableCell className="capitalize">{f.consent_type === 'tattoo' ? 'Tattoo' : 'Piercing'}</TableCell>
                      <TableCell><StatusBadge status={f.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(f.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Formular löschen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchten Sie das Formular von <strong>{f.first_name} {f.last_name}</strong> wirklich löschen?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteForm(f.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
