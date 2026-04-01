import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Key, User } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Fehler', description: 'Passwort muss mindestens 6 Zeichen lang sein.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Fehler', description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Passwort aktualisiert', description: 'Ihr Passwort wurde erfolgreich geändert.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    }
    setChanging(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="text-sm font-medium">{profile?.full_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">E-Mail</Label>
              <p className="text-sm font-medium">{profile?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Rolle</Label>
              <p className="text-sm font-medium capitalize">{profile?.role === 'admin' ? 'Admin' : profile?.role === 'piercer' ? 'Piercer' : profile?.role === 'tattoo_artist' ? 'Tattoo Artist' : 'Designer'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>Neues Passwort</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div className="space-y-2">
                <Label>Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Passwort erneut eingeben"
                />
              </div>
              <Button type="submit" disabled={changing}>
                {changing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Passwort aktualisieren
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
