import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { FileText, FileCheck, Search, Clock, Loader2, Trash2, CheckCircle, Pencil, Download, Plus, CalendarPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ConsentForm, Profile } from '@/types';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { Badge } from '@/components/ui/badge';

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

export default function DesignerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [artists, setArtists] = useState<Profile[]>([]);
  const [appointmentDrafts, setAppointmentDrafts] = useState<AppointmentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [assignedArtists, setAssignedArtists] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [vormerkungOpen, setVormerkungOpen] = useState(false);
  const [vormerkungSaving, setVormerkungSaving] = useState(false);
  const [vmFirstName, setVmFirstName] = useState('');
  const [vmLastName, setVmLastName] = useState('');
  const [vmPhone, setVmPhone] = useState<string | null>(null);
  const [vmDeposit, setVmDeposit] = useState('');

  const handleSaveVormerkung = async () => {
    if (!vmFirstName.trim()) {
      toast({ title: 'Fehler', description: 'Vorname ist erforderlich.', variant: 'destructive' });
      return;
    }
    if (!vmLastName.trim()) {
      toast({ title: 'Fehler', description: 'Nachname ist erforderlich.', variant: 'destructive' });
      return;
    }
    setVormerkungSaving(true);
    const { error } = await supabase.from('appointment_drafts').insert({
      first_name: vmFirstName.trim(),
      last_name: vmLastName.trim(),
      phone: vmPhone || null,
      deposit_amount: vmDeposit || null,
      created_by: user!.id,
    } as any);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Terminvormerkung gespeichert' });
      setVmFirstName(''); setVmLastName(''); setVmPhone(null); setVmDeposit('');
      setVormerkungOpen(false);
      fetchData();
    }
    setVormerkungSaving(false);
  };

  const fetchData = async () => {
    if (!user) return;
    const [formsRes, artistsRes, draftsRes] = await Promise.all([
      supabase.from('consent_forms').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('appointment_drafts').select('*').eq('created_by', user.id).is('linked_form_id', null).order('created_at', { ascending: false }),
    ]);
    if (formsRes.data) {
      const data = formsRes.data as unknown as ConsentForm[];
      setForms(data);
      const artMap: Record<string, string> = {};
      const priceMap: Record<string, string> = {};
      data.forEach(f => {
        if (f.assigned_artist_id) artMap[f.id] = f.assigned_artist_id;
        if (f.price) priceMap[f.id] = f.price;
      });
      setAssignedArtists(artMap);
      setPrices(priceMap);
    }
    if (artistsRes.data) setArtists((artistsRes.data as unknown as Profile[]).filter(a => a.role === 'tattoo_artist' || a.role === 'piercer'));
    if (draftsRes.data) setAppointmentDrafts(draftsRes.data as unknown as AppointmentDraft[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleApprove = async (formId: string) => {
    const artistId = assignedArtists[formId];
    const price = prices[formId];
    if (!artistId) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie einen Artist aus.', variant: 'destructive' });
      return;
    }
    setApprovingId(formId);
    const form = forms.find(f => f.id === formId);
    const artistProfile = artists.find(a => a.id === artistId);

    const { error } = await supabase.from('consent_forms').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      assigned_artist_id: artistId,
      price: price || null,
    }).eq('id', formId);

    if (error) {
      toast({ title: 'Genehmigung fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      const isVormerkung = !!form?.deposit_amount;
      const depositNum = parseFloat(form?.deposit_amount || '0') || 0;
      const restNum = parseFloat(price || '0') || 0;
      const totalNum = depositNum + restNum;

      // Insert into unified all_completed_forms table
      await supabase.from('all_completed_forms' as any).insert({
        form_id: formId,
        consent_type: form?.consent_type || 'tattoo',
        first_name: form?.first_name || '',
        last_name: form?.last_name || '',
        email: form?.email || null,
        phone: form?.phone || null,
        date_of_birth: form?.date_of_birth || null,
        gender: (form as any)?.gender || null,
        body_area: form?.body_area || null,
        procedure_description: form?.procedure_description || null,
        assigned_artist_id: artistId,
        artist_name: artistProfile?.full_name || '',
        deposit_amount: isVormerkung ? form.deposit_amount : null,
        rest_amount: isVormerkung ? restNum.toString() : null,
        total_price: isVormerkung ? totalNum.toString() : (price || null),
        source: isVormerkung ? 'vormerkung' : 'regular',
        approved_at: new Date().toISOString(),
        created_by: user?.id,
      });

      // Also keep existing flows for backwards compatibility
      if (isVormerkung) {
        await supabase.from('completed_appointments' as any).insert({
          form_id: formId,
          consent_type: form.consent_type || 'tattoo',
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || null,
          phone: form.phone || null,
          date_of_birth: form.date_of_birth || null,
          gender: (form as any).gender || null,
          body_area: form.body_area || null,
          procedure_description: form.procedure_description || null,
          assigned_artist_id: artistId,
          artist_name: artistProfile?.full_name || '',
          deposit_amount: form.deposit_amount,
          total_price: price || null,
          rest_amount: restNum.toString(),
          approved_at: new Date().toISOString(),
          created_by: user?.id,
        });
      } else {
        await supabase.from('form_assignments' as any).insert({
          form_id: formId,
          consent_type: form?.consent_type || 'tattoo',
          assigned_artist_id: artistId,
          artist_name: artistProfile?.full_name || '',
          price: price || null,
          assigned_by: user?.id,
        });
      }

      // Generate PDF
      try {
        await supabase.functions.invoke('generate-consent-pdf', {
          body: { formId },
        });
      } catch (pdfErr) {
        console.error('PDF generation failed:', pdfErr);
      }

      toast({ title: 'Formular genehmigt', description: 'PDF wurde erstellt.' });
      fetchData();
    }
    setApprovingId(null);
  };

  const handleDelete = async (formId: string) => {
    setDeletingId(formId);
    const { error } = await supabase.from('consent_forms').delete().eq('id', formId);
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Formular gelöscht' });
      fetchData();
    }
    setDeletingId(null);
  };

  const handleDeleteDraft = async (draftId: string) => {
    setDeletingId(draftId);
    const { error } = await supabase.from('appointment_drafts').delete().eq('id', draftId);
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vormerkung gelöscht' });
      fetchData();
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
      ...(draft.deposit_amount ? { deposit_amount: draft.deposit_amount } : {}),
    });
    navigate(`/forms/new?${params.toString()}`);
  };

  const totalForms = forms.length;
  const draftForms = forms.filter(f => f.status === 'draft').length;
  const approvedForms = forms.filter(f => f.status === 'approved').length;

  const filtered = forms.filter(f => {
    const matchSearch = f.first_name.toLowerCase().includes(search.toLowerCase()) ||
      f.last_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredDrafts = appointmentDrafts.filter(d => {
    if (!search) return true;
    return d.first_name.toLowerCase().includes(search.toLowerCase()) ||
      d.last_name.toLowerCase().includes(search.toLowerCase());
  });

  const draftList = filtered.filter(f => f.status === 'draft');
  const approvedList = filtered.filter(f => f.status === 'approved');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Einverständnisbögen</h1>
            <p className="text-muted-foreground text-sm mt-1">Kunden-Einverständnisbögen erstellen und verwalten</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/forms/new?type=tattoo')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Tattoo
            </Button>
            <Button onClick={() => navigate('/forms/new?type=piercing')} variant="outline" className="gap-2">
              Piercing
            </Button>
            <Button onClick={() => setVormerkungOpen(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Plus className="h-4 w-4" /> Vormerkung
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtanzahl</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : totalForms}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entwurf</CardTitle>
              <Clock className="h-4 w-4 text-status-draft" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : draftForms}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Genehmigt</CardTitle>
              <FileCheck className="h-4 w-4 text-status-approved" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : approvedForms}</p></CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nach Kundenname suchen..." value={search} onChange={e => setSearch(e.target.value)} />
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

        {/* Draft Forms & Vormerkungen */}
        {(filterStatus === 'all' || filterStatus === 'draft') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-status-draft" />
                Entwürfe & Vormerkungen ({draftList.length + filteredDrafts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {draftList.length === 0 && filteredDrafts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Keine Entwürfe oder Vormerkungen vorhanden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kundenname</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Appointment Drafts (Vormerkungen) */}
                    {filteredDrafts.map(d => (
                      <TableRow key={`draft-${d.id}`} className="bg-amber-500/5 border-l-2 border-l-amber-500/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {d.first_name} {d.last_name}
                            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/20 text-[10px] px-1.5 py-0">
                              Vormerkung
                            </Badge>
                          </div>
                          {d.deposit_amount && (
                            <span className="text-xs text-muted-foreground">Kapora: € {d.deposit_amount}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm italic">Noch offen</TableCell>
                        <TableCell className="text-muted-foreground text-sm">—</TableCell>
                        <TableCell className="text-muted-foreground text-sm">—</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleStartConsent(d)}
                              className="gap-1 bg-amber-500 text-white hover:bg-amber-600"
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
                                  <AlertDialogAction onClick={() => handleDeleteDraft(d.id)} className="bg-destructive text-destructive-foreground">
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Regular Draft Forms */}
                    {draftList.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                        <TableCell className="capitalize">{f.consent_type === 'tattoo' ? 'Tattoo' : 'Piercing'}</TableCell>
                        <TableCell>
                          <Select
                            value={assignedArtists[f.id] || ''}
                            onValueChange={v => setAssignedArtists(prev => ({ ...prev, [f.id]: v }))}
                          >
                            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Artist wählen" /></SelectTrigger>
                            <SelectContent>
                              {artists
                                .filter(a => f.consent_type === 'piercing' ? a.role === 'piercer' : a.role === 'tattoo_artist')
                                .map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-[100px]"
                            placeholder="€ 0"
                            value={prices[f.id] || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/forms/${f.id}`)}>
                              <Pencil className="h-4 w-4 mr-1" /> Bearbeiten
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(f.id)}
                              disabled={approvingId === f.id}
                              className="bg-primary text-primary-foreground"
                            >
                              {approvingId === f.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                              Genehmigen
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
                                  <AlertDialogAction onClick={() => handleDelete(f.id)} className="bg-destructive text-destructive-foreground">
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
        )}

        {/* Approved Forms */}
        {(filterStatus === 'all' || filterStatus === 'approved') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-status-approved" />
                Genehmigte Formulare ({approvedList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Keine genehmigten Formulare.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kundenname</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Genehmigt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedList.map(f => {
                      const artist = artists.find(a => a.id === f.assigned_artist_id);
                      return (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                          <TableCell className="capitalize">{f.consent_type === 'tattoo' ? 'Tattoo' : 'Piercing'}</TableCell>
                          <TableCell>{artist?.full_name || '—'}</TableCell>
                          
                          <TableCell className="text-muted-foreground text-sm">
                            {f.approved_at ? new Date(f.approved_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={vormerkungOpen} onOpenChange={setVormerkungOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Terminvormerkung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Vorname <span className="text-destructive">*</span></Label>
                  <Input value={vmFirstName} onChange={e => setVmFirstName(e.target.value)} placeholder="Max" />
                </div>
                <div className="space-y-2">
                  <Label>Nachname <span className="text-destructive">*</span></Label>
                  <Input value={vmLastName} onChange={e => setVmLastName(e.target.value)} placeholder="Mustermann" />
                </div>
              </div>
              <PhoneInput value={vmPhone} onChange={setVmPhone} />
              <div className="space-y-2">
                <Label>Kapora (€)</Label>
                <Input value={vmDeposit} onChange={e => setVmDeposit(e.target.value)} placeholder="z.B. 50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVormerkungOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSaveVormerkung} disabled={vormerkungSaving} className="gap-2 bg-primary text-primary-foreground">
                {vormerkungSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
