import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
// No logoImg import needed as we use the favicon from public/


export default function Auth() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/designer', { replace: true });
    }
  }, [loading, session, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Felder aus.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Anmeldung fehlgeschlagen', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-gradient-auth">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient-auth px-4">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto">
            <img
              src="/favicon.ico"
              alt="Einwilligungs-Manager"
              width={72}
              height={72}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-xl font-bold">Einwilligungs-Manager</CardTitle>
          <CardDescription>Melden Sie sich mit Ihrem Mitarbeiter-Konto an</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                autoComplete="email"
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-muted/30"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Anmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
