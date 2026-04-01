import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import type { ConsentForm, Profile } from '@/types';
// No logoImg import needed as we use the favicon from public/


type Period = '1' | '2' | '3' | '6' | '12' | 'custom';

function getMonthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const day = start.getDate().toString().padStart(2, '0');
  const month = start.toLocaleDateString('de-DE', { month: 'short' });
  return `${day}. ${month}`;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getAgeGroup(age: number): string {
  if (age < 18) return 'Unter 18';
  if (age <= 21) return '18–21';
  if (age <= 25) return '22–25';
  if (age <= 30) return '26–30';
  if (age <= 35) return '31–35';
  if (age <= 40) return '36–40';
  return '41+';
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Insta',
  google: 'Google',
  facebook: 'FB',
  walkin: 'Laufkund..',
  other: 'Sonstiges',
  sonstiges: 'Sonstiges',
};

const BAR_COLORS = ['#D4A03C', '#C4843C', '#3DB87A', '#E87C6F', '#8B9DC3', '#A0A0A0'];
const DONUT_COLORS = ['#D4A03C', '#C4843C', '#3DB87A', '#E87C6F', '#8B9DC3', '#F5A0C0'];

export default function AdminStatisticsPage() {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('3');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('consent_forms').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]).then(([formsRes, profilesRes]) => {
      if (formsRes.data) setForms(formsRes.data as unknown as ConsentForm[]);
      if (profilesRes.data) setProfiles(profilesRes.data as unknown as Profile[]);
      setLoading(false);
    });
  }, []);

  const cutoff = useMemo(() => {
    if (period === 'custom' && customFrom) {
      return new Date(customFrom);
    }
    return getMonthsAgo(parseInt(period));
  }, [period, customFrom]);

  const cutoffEnd = useMemo(() => {
    if (period === 'custom' && customTo) {
      const d = new Date(customTo);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    return new Date();
  }, [period, customTo]);

  const filtered = useMemo(() =>
    forms.filter(f => f.status === 'approved' && new Date(f.created_at) >= cutoff && new Date(f.created_at) <= cutoffEnd),
    [forms, cutoff, cutoffEnd]
  );

  const tattooForms = filtered.filter(f => f.consent_type === 'tattoo');
  const piercingForms = filtered.filter(f => f.consent_type === 'piercing');

  const totalRevenue = filtered.reduce((s, f) => s + (parseFloat(f.price || '0') || 0), 0);
  const tattooRevenue = tattooForms.reduce((s, f) => s + (parseFloat(f.price || '0') || 0), 0);
  const piercingRevenue = piercingForms.reduce((s, f) => s + (parseFloat(f.price || '0') || 0), 0);
  const avgPerPerson = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

  // Weekly revenue chart data
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    const now = cutoffEnd;
    const start = new Date(cutoff);
    // Generate week labels
    const current = new Date(start);
    current.setDate(current.getDate() - current.getDay() + 1); // align to Monday
    while (current <= now) {
      const label = getWeekLabel(current);
      weeks[label] = 0;
      current.setDate(current.getDate() + 7);
    }
    filtered.forEach(f => {
      const d = new Date(f.created_at);
      const label = getWeekLabel(d);
      if (label in weeks) weeks[label] += parseFloat(f.price || '0') || 0;
    });
    let cumulative = 0;
    return Object.entries(weeks).map(([week, rev]) => {
      cumulative += rev;
      return { week, revenue: cumulative };
    });
  }, [filtered, cutoff, cutoffEnd]);

  // Customer sources
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(f => {
      const src = (f.reference_notes || 'other').toLowerCase();
      const label = SOURCE_LABELS[src] || src;
      counts[label] = (counts[label] || 0) + 1;
    });
    // Ensure all standard sources appear
    Object.values(SOURCE_LABELS).forEach(l => {
      if (!(l in counts)) counts[l] = 0;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Revenue by source (tattoo)
  const tattooRevenueBySource = useMemo(() => {
    const map: Record<string, { forms: number; revenue: number }> = {};
    tattooForms.forEach(f => {
      const src = SOURCE_LABELS[(f.reference_notes || 'other').toLowerCase()] || f.reference_notes || 'Other';
      if (!map[src]) map[src] = { forms: 0, revenue: 0 };
      map[src].forms++;
      map[src].revenue += parseFloat(f.price || '0') || 0;
    });
    return Object.entries(map).map(([source, data]) => ({ source, ...data }));
  }, [tattooForms]);

  // Revenue by source (piercing)
  const piercingRevenueBySource = useMemo(() => {
    const map: Record<string, { forms: number; revenue: number }> = {};
    piercingForms.forEach(f => {
      const src = SOURCE_LABELS[(f.reference_notes || 'other').toLowerCase()] || f.reference_notes || 'Other';
      if (!map[src]) map[src] = { forms: 0, revenue: 0 };
      map[src].forms++;
      map[src].revenue += parseFloat(f.price || '0') || 0;
    });
    return Object.entries(map).map(([source, data]) => ({ source, ...data }));
  }, [piercingForms]);

  // Revenue share by source (all)
  const revenueShareBySource = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(f => {
      const src = SOURCE_LABELS[(f.reference_notes || 'other').toLowerCase()] || f.reference_notes || 'Other';
      map[src] = (map[src] || 0) + (parseFloat(f.price || '0') || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Age groups
  const ageGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    let totalAge = 0;
    let ageCount = 0;
    filtered.forEach(f => {
      if (f.date_of_birth) {
        const age = calculateAge(f.date_of_birth);
        const group = getAgeGroup(age);
        groups[group] = (groups[group] || 0) + 1;
        totalAge += age;
        ageCount++;
      }
    });
    return {
      data: Object.entries(groups).map(([name, value]) => ({ name, value })),
      avgAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0,
      total: ageCount,
    };
  }, [filtered]);

  const tattooAgeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    let totalAge = 0, count = 0;
    tattooForms.forEach(f => {
      if (f.date_of_birth) {
        const age = calculateAge(f.date_of_birth);
        groups[getAgeGroup(age)] = (groups[getAgeGroup(age)] || 0) + 1;
        totalAge += age;
        count++;
      }
    });
    return {
      data: Object.entries(groups).map(([name, value]) => ({ name, value })),
      avgAge: count > 0 ? Math.round(totalAge / count) : 0,
    };
  }, [tattooForms]);

  const piercingAgeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    let totalAge = 0, count = 0;
    piercingForms.forEach(f => {
      if (f.date_of_birth) {
        const age = calculateAge(f.date_of_birth);
        groups[getAgeGroup(age)] = (groups[getAgeGroup(age)] || 0) + 1;
        totalAge += age;
        count++;
      }
    });
    return {
      data: Object.entries(groups).map(([name, value]) => ({ name, value })),
      avgAge: count > 0 ? Math.round(totalAge / count) : 0,
    };
  }, [piercingForms]);

  // Tattoo vs Piercing revenue split
  const revenueSplit = useMemo(() => [
    { name: 'Tattoo', value: tattooRevenue },
    { name: 'Piercing', value: piercingRevenue },
  ].filter(d => d.value > 0), [tattooRevenue, piercingRevenue]);

  // Artist performance (tattoo artists only)
  const artistPerformance = useMemo(() => {
    const map: Record<string, { sessions: number; revenue: number }> = {};
    filtered.filter(f => f.consent_type === 'tattoo').forEach(f => {
      if (f.assigned_artist_id) {
        if (!map[f.assigned_artist_id]) map[f.assigned_artist_id] = { sessions: 0, revenue: 0 };
        map[f.assigned_artist_id].sessions++;
        map[f.assigned_artist_id].revenue += parseFloat(f.price || '0') || 0;
      }
    });
    return Object.entries(map).map(([artistId, data]) => {
      const profile = profiles.find(p => p.id === artistId);
      return {
        name: profile?.full_name || 'Unbekannt',
        ...data,
        avgPerSession: data.sessions > 0 ? Math.round(data.revenue / data.sessions) : 0,
      };
    });
  }, [filtered, profiles]);

  // Piercer performance
  const piercerPerformance = useMemo(() => {
    const map: Record<string, { sessions: number; revenue: number }> = {};
    filtered.filter(f => f.consent_type === 'piercing').forEach(f => {
      if (f.assigned_artist_id) {
        if (!map[f.assigned_artist_id]) map[f.assigned_artist_id] = { sessions: 0, revenue: 0 };
        map[f.assigned_artist_id].sessions++;
        map[f.assigned_artist_id].revenue += parseFloat(f.price || '0') || 0;
      }
    });
    return Object.entries(map).map(([artistId, data]) => {
      const profile = profiles.find(p => p.id === artistId);
      return {
        name: profile?.full_name || 'Unbekannt',
        ...data,
        avgPerSession: data.sessions > 0 ? Math.round(data.revenue / data.sessions) : 0,
      };
    });
  }, [filtered, profiles]);

  const periods: { label: string; value: Period }[] = [
    { label: '1 Mo', value: '1' },
    { label: '2 Mo', value: '2' },
    { label: '3 Mo', value: '3' },
    { label: '6 Mo', value: '6' },
    { label: '12 Mo', value: '12' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/favicon.ico" alt="" width={48} height={48} className="rounded-full" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
              <p className="text-muted-foreground text-sm">Detaillierte Geschäftsanalysen & Berichte</p>
            </div>
          </div>
        </div>

        {/* Period filter + Export */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1 items-center flex-wrap">
            {periods.map(p => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className={period === p.value ? 'bg-primary text-primary-foreground' : ''}
              >
                {p.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={period === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={period === 'custom' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Benutzerdefiniert
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-3" align="start">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Von</label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={e => { setCustomFrom(e.target.value); setPeriod('custom'); }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Bis</label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={e => { setCustomTo(e.target.value); setPeriod('custom'); }}
                    className="h-8 text-sm"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
              <p className="text-2xl font-bold mt-1">€{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tattoo-Umsatz</p>
              <p className="text-2xl font-bold mt-1">€{tattooRevenue.toLocaleString()}</p>
              {totalRevenue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{Math.round(tattooRevenue / totalRevenue * 100)}% vom Gesamtumsatz</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Piercing-Umsatz</p>
              <p className="text-2xl font-bold mt-1">€{piercingRevenue.toLocaleString()}</p>
              {totalRevenue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{Math.round(piercingRevenue / totalRevenue * 100)}% vom Gesamtumsatz</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ø Preis pro Person</p>
              <p className="text-2xl font-bold mt-1">€{avgPerPerson.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Durchschnitt pro Kunde</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Revenue Chart */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Wöchentlicher Umsatz & Volumen</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gesamt: {filtered.length} Formulare · {tattooForms.length} Tattoo · {piercingForms.length} Piercing
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `€${v}`} />
                  <Tooltip formatter={(v: number) => [`€${v}`, 'Umsatz']} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Sources */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Kundenquellen</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceCounts} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" horizontal={true} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => [`${name} : ${value} (${sourceCounts.length > 0 ? Math.round(value / sourceCounts.reduce((a, b) => a + b.value, 0) * 100) : 0}%)`, name]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} label={{ position: 'top', fontSize: 13, fill: 'hsl(var(--primary))', fontWeight: 600 }}>
                    {sourceCounts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tattoo Revenue by Source */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Tattoo-Umsatz nach Quelle</h3>
                <p className="text-sm text-muted-foreground">Umsatzverteilung nach Kundenquelle</p>
              </div>
              <span className="text-sm text-muted-foreground">{tattooForms.length} Tattoo-Formulare</span>
            </div>
            {tattooRevenueBySource.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Tattoo-Umsatzdaten in diesem Zeitraum</p>
            ) : (
              <div className="space-y-3">
                {tattooRevenueBySource.map((item, i) => (
                  <div key={item.source} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm font-medium w-24">{item.source}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${tattooRevenue > 0 ? (item.revenue / tattooRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">Formulare</span>
                    <span className="text-sm font-bold w-8 text-right">{item.forms}</span>
                    <span className="text-sm text-muted-foreground w-16 text-right">Umsatz</span>
                    <span className="text-sm font-bold text-primary w-16 text-right">€{item.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Piercing Revenue by Source */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Piercing-Umsatz nach Quelle</h3>
                <p className="text-sm text-muted-foreground">Umsatzverteilung nach Kundenquelle</p>
              </div>
              <span className="text-sm text-muted-foreground">{piercingForms.length} Piercing-Formulare</span>
            </div>
            {piercingRevenueBySource.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Keine Piercing-Umsatzdaten in diesem Zeitraum</p>
              </div>
            ) : (
              <div className="space-y-3">
                {piercingRevenueBySource.map((item, i) => (
                  <div key={item.source} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm font-medium w-24">{item.source}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${piercingRevenue > 0 ? (item.revenue / piercingRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{item.forms}</span>
                    <span className="text-sm font-bold text-primary w-16 text-right">€{item.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Share by Source - Donut */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Umsatzanteil nach Quelle</h3>
            <p className="text-sm text-muted-foreground mb-4">Verteilung des Gesamtumsatzes nach Kanal</p>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueShareBySource.length > 0 ? revenueShareBySource : [{ name: 'N/A', value: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      dataKey="value"
                    >
                      {revenueShareBySource.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" className="text-xs fill-muted-foreground">GESAMT</text>
                    <text x="50%" y="58%" textAnchor="middle" className="text-lg font-bold fill-foreground">€{totalRevenue}</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {revenueShareBySource.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm font-medium w-24">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (item.value / totalRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">€{item.value}</span>
                    <Badge variant="outline" className="text-xs text-primary border-primary/20">
                      {totalRevenue > 0 ? Math.round(item.value / totalRevenue * 100) : 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tattoo vs Piercing Revenue Split */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Tattoo vs. Piercing — Umsatzaufteilung</h3>
            <p className="text-sm text-muted-foreground mb-4">Verteilung des Gesamtumsatzes nach Dienstleistung</p>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSplit.length > 0 ? revenueSplit : [{ name: 'N/A', value: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      dataKey="value"
                    >
                      {revenueSplit.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" className="text-xs fill-muted-foreground">GESAMT</text>
                    <text x="50%" y="58%" textAnchor="middle" className="text-lg font-bold fill-foreground">€{totalRevenue}</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {revenueSplit.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm font-medium w-24">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (item.value / totalRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">€{item.value}</span>
                    <Badge variant="outline" className="text-xs text-primary border-primary/20">
                      {totalRevenue > 0 ? Math.round(item.value / totalRevenue * 100) : 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tattoo Age Groups */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Tattoo-Kunden — Altersgruppen</h3>
            <p className="text-sm text-muted-foreground mb-4">Verteilung der Tattoo-Kunden nach Altersgruppe</p>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tattooAgeGroups.data.length > 0 ? tattooAgeGroups.data : [{ name: 'N/A', value: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      dataKey="value"
                    >
                      {tattooAgeGroups.data.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" className="text-xs fill-muted-foreground">Ø ALTER</text>
                    <text x="50%" y="58%" textAnchor="middle" className="text-lg font-bold fill-foreground">{tattooAgeGroups.avgAge}</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {tattooAgeGroups.data.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm font-medium w-20">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${tattooForms.length > 0 ? (item.value / tattooForms.length * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{item.value}</span>
                    <Badge variant="outline" className="text-xs text-primary border-primary/20">
                      {tattooForms.length > 0 ? Math.round(item.value / tattooForms.length * 100) : 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Piercing Age Groups */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Piercing-Kunden — Altersgruppen</h3>
            <p className="text-sm text-muted-foreground mb-4">Verteilung der Piercing-Kunden nach Altersgruppe</p>
            {piercingAgeGroups.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ø ALTER</p>
                <p className="text-3xl font-bold">0</p>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={piercingAgeGroups.data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                        {piercingAgeGroups.data.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" className="text-xs fill-muted-foreground">Ø ALTER</text>
                      <text x="50%" y="58%" textAnchor="middle" className="text-lg font-bold fill-foreground">{piercingAgeGroups.avgAge}</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {piercingAgeGroups.data.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-sm font-medium w-20">{item.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${piercingForms.length > 0 ? (item.value / piercingForms.length * 100) : 0}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{item.value}</span>
                      <Badge variant="outline" className="text-xs text-primary border-primary/20">
                        {piercingForms.length > 0 ? Math.round(item.value / piercingForms.length * 100) : 0}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Artist Performance (Tattoo) */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Tattoo-Artist-Leistung</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {artistPerformance.length} Künstler · {filtered.filter(f => f.consent_type === 'tattoo').length} Sitzungen
            </p>
            {artistPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Künstler-Daten vorhanden</p>
            ) : (
              <div className="space-y-4">
                {artistPerformance.map((artist, i) => (
                  <div key={artist.name} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-sm font-medium flex-1">{artist.name}</span>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Sitzungen</p>
                          <p className="font-bold">{artist.sessions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Ø / Sitzung</p>
                          <p className="font-bold">€{artist.avgPerSession}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Umsatz</p>
                          <p className="font-bold text-primary">€{artist.revenue}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (artist.revenue / totalRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Piercer Performance */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold">Piercer-Leistung</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {piercerPerformance.length} Piercer · {filtered.filter(f => f.consent_type === 'piercing').length} Sitzungen
            </p>
            {piercerPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Piercer-Daten vorhanden</p>
            ) : (
              <div className="space-y-4">
                {piercerPerformance.map((piercer, i) => (
                  <div key={piercer.name} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-sm font-medium flex-1">{piercer.name}</span>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Sitzungen</p>
                          <p className="font-bold">{piercer.sessions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Ø / Sitzung</p>
                          <p className="font-bold">€{piercer.avgPerSession}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Umsatz</p>
                          <p className="font-bold text-primary">€{piercer.revenue}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (piercer.revenue / totalRevenue * 100) : 0}%`,
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
