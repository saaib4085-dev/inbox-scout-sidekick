import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInsights from '@/components/analytics/PersonalInsights';
import CompanyInsights from '@/components/analytics/CompanyInsights';

export default function Analytics() {
  const { user } = useOutletContext();
  const [personal, setPersonal] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    const load = async () => {
      const response = await base44.functions.invoke('analytics', { scope: 'personal' });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      setPersonal(response.data.personal);
    };
    load().catch(() => setError('Could not load your insights. Please try again.'));
  }, []);

  useEffect(() => {
    if (tab !== 'company' || company || companyLoading) return;
    setCompanyLoading(true);
    const load = async () => {
      const response = await base44.functions.invoke('analytics', { scope: 'company' });
      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setCompany(response.data.company);
      }
      setCompanyLoading(false);
    };
    load().catch(() => {
      setError('Could not load company insights. Please try again.');
      setCompanyLoading(false);
    });
  }, [tab, company, companyLoading]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <div className="border-b hairline pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Analytics</p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-[2.9rem]">
          Insights
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your own scouting performance, and — for admins — how the whole company is using InboxHero.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="personal">Your data</TabsTrigger>
          <TabsTrigger value="company">Company data</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          {personal ? (
            <PersonalInsights data={personal} name={user?.full_name} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading your insights…</p>
          )}
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          {companyLoading && !company ? (
            <p className="text-sm text-muted-foreground">Loading company insights…</p>
          ) : (
            <CompanyInsights data={company} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}