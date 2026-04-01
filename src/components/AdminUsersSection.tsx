import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Search, Trash2, Key } from 'lucide-react';
import type { Profile } from '@/types';

export function AdminUsersSection() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('designer');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Password change state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data as unknown as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formName || !formPassword || !formRole) {
      toast({ title: 'Fehler', description: 'Alle Felder sind erforderlich.', variant: 'destructive' });
      return;
    }
    if (formPassword.length < 6) {
      toast({ title: 'Fehler', description: 'Passwort muss mindestens 6 Zeichen lang sein.', variant: 'destructive' });
      return;
    }
    if (formPassword !== formPasswordConfirm) {
      toast({ title: 'Fehler', description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: formEmail, password: formPassword, full_name: formName, role: formRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Benutzer erstellt', description: `${formEmail} wurde erfolgreich hinzugefügt.` });
      setCreateOpen(false);
      setFormEmail('');
      setFormName('');
      setFormPassword('');
      setFormPasswordConfirm('');
      setFormRole('designer');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erstellung fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Benutzer gelöscht' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Löschen fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    setDeletingId(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Fehler', description: 'Passwort muss mindestens 6 Zeichen lang sein.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Fehler', description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'change_password', user_id: passwordUserId, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Passwort aktualisiert' });
      setPasswordOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordUserId(null);
    } catch (err: any) {
      toast({ title: 'Passwortänderung fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    setChangingPassword(false);
  };

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mitarbeiterliste</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />Benutzer hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuen Benutzer erstellen</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Vollständiger Name</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Vollständiger Name" />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@studio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Passwort</Label>
                  <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" />
                </div>
                <div className="space-y-2">
                  <Label>Passwort bestätigen</Label>
                  <Input type="password" value={formPasswordConfirm} onChange={e => setFormPasswordConfirm(e.target.value)} placeholder="Passwort erneut eingeben" />
                </div>
                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="piercer">Piercer</SelectItem>
                      <SelectItem value="tattoo_artist">Tattoo Artist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
              <Input className="pl-9" placeholder="Benutzer suchen..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Alle Rollen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="piercer">Piercer</SelectItem>
                <SelectItem value="tattoo_artist">Tattoo Artist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Benutzer gefunden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Vollständiger Name</TableHead>
                   <TableHead>E-Mail</TableHead>
                   <TableHead>Rolle</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Beigetreten</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setPasswordUserId(u.id);
                            setPasswordOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
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
                                  onClick={() => handleDelete(u.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={passwordOpen} onOpenChange={v => { setPasswordOpen(v); if (!v) { setNewPassword(''); setConfirmNewPassword(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Passwort ändern</DialogTitle></DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Neues Passwort</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" />
            </div>
            <div className="space-y-2">
              <Label>Passwort bestätigen</Label>
              <Input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Passwort erneut eingeben" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={changingPassword}>
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Passwort aktualisieren
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
