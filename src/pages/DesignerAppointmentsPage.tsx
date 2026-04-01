import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CalendarPlus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/forms/PhoneInput';

interface AppointmentDraft {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  deposit_amount: string | null;
  created_at: string;
  created_by: string | null;
  linked_form_id: string | null;
}

export default function DesignerAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<AppointmentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const fetchDrafts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointment_drafts')
      .select('*')
      .eq('created_by', user.id)
      .is('linked_form_id', null)
      .order('created_at', { ascending: false });
    if (data) setDrafts(data as unknown as AppointmentDraft[]);
    setLoading(false);
  };

  useEffect(() => { fetchDrafts(); }, [user]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast({ title: 'Fehler', description: 'Vorname ist erforderlich.', variant: 'destructive' });
      return;
    }
    if (!lastName.trim()) {
      toast({ title: 'Fehler', description: 'Nachname ist erforderlich.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('appointment_drafts').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone || null,
      deposit_amount: depositAmount || null,
      created_by: user!.id,
    } as any);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Terminvormerkung gespeichert' });
      setFirstName('');
      setLastName('');
      setPhone(null);
      setDepositAmount('');
      setDialogOpen(false);
      fetchDrafts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('appointment_drafts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vormerkung gelöscht' });
      fetchDrafts();
    }
    setDeletingId(null);
  };

  const handleStartConsent = (draft: AppointmentDraft) => {
    const params = new URLSearchParams({
      type: 'tattoo',
      draft_id: draft.id,
      first_name: draft.first_name,
      last_name: draft.last_name,
      ...(draft.phone ? { phone: draft.phone } : {}),
    });
    navigate(`/forms/new?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Terminvormerke</h1>
            <p className="text-muted-foreground text-sm mt-1">Kunden für zukünftige Tattoo-Termine vormerken</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Neue Vormerkung
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offene Vormerkungen ({drafts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Keine offenen Vormerkungen.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kundenname</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kapora</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.first_name} {d.last_name}</TableCell>
                      <TableCell>{d.phone || '—'}</TableCell>
                      <TableCell>{d.deposit_amount ? `€ ${d.deposit_amount}` : '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(d.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleStartConsent(d)}
                            className="gap-1 bg-primary text-primary-foreground"
                          >
                            <CalendarPlus className="h-4 w-4" /> Formular starten
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Vormerkung löschen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchten Sie die Vormerkung von <strong>{d.first_name} {d.last_name}</strong> wirklich löschen?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(d.id)} className="bg-destructive text-destructive-foreground">
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Terminvormerkung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Vorname <span className="text-destructive">*</span></Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Max" />
                </div>
                <div className="space-y-2">
                  <Label>Nachname <span className="text-destructive">*</span></Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mustermann" />
                </div>
              </div>
              <PhoneInput value={phone} onChange={setPhone} />
              <div className="space-y-2">
                <Label>Kapora (€)</Label>
                <Input value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="z.B. 50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
