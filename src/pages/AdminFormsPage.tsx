import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { Search } from 'lucide-react';
import type { ConsentForm } from '@/types';

export default function AdminFormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    supabase
      .from('consent_forms')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setForms(data as unknown as ConsentForm[]);
        setLoading(false);
      });
  }, []);

  const filtered = forms.filter(f => {
    const matchSearch = f.first_name.toLowerCase().includes(search.toLowerCase()) ||
      f.last_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Alle Einverständnisbögen</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-4">
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
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Keine Formulare gefunden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Kunde</TableHead>
                     <TableHead>Typ</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Erstellt</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                      <TableCell className="capitalize">{f.consent_type}</TableCell>
                      <TableCell><StatusBadge status={f.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(f.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/forms/${f.id}`)}>Anzeigen</Button>
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
