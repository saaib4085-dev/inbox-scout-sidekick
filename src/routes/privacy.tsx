import { createFileRoute, Link } from "@tanstack/react-router";
import { Bullets, LegalPage, Section } from "@/components/app/LegalPage";
import { OPERATOR, PROCESSORS, RETENTION } from "@/lib/policies";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — InboxHero" },
      { name: "description", content: "What data InboxHero collects, how long it is kept, who processes it, and your GDPR rights." },
      { property: "og:title", content: "Privacy Policy — InboxHero" },
      { property: "og:description", content: "How InboxHero handles your data under GDPR." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what personal data InboxHero collects, why, how long we keep it, who processes it for us, and the rights you have under the EU General Data Protection Regulation (GDPR)."
    >
      <Section title="What we collect">
        <Bullets
          items={[
            "Account details: your email address, name, and sign-in method.",
            "Content you add: prompts, emails you paste in, your signature and brand voice, generated drafts, and outbox messages.",
            "Lead information: business names, contact details and notes you import, add by hand, or find through business search (public listings).",
            "Billing records: your plan, credit history, and purchase confirmations. Card details are handled only by Stripe.",
            "Mailbox connections: if you connect Gmail or Outlook, a link that lets us send the emails you approve. We do not read your inbox.",
          ]}
        />
      </Section>
      <Section title="AI processing">
        <p>
          To generate drafts and answer assistant questions, your prompts and inputs (including pasted emails, lead details
          and brand voice) are sent to an AI language model — Anthropic's Claude, through the Lovable AI Gateway. The model
          produces draft text that you review before anything is sent. Your data is not used by us to train AI models.
        </p>
      </Section>
      <Section title="Who processes your data">
        <Bullets items={PROCESSORS.map((p) => <><strong>{p.name}:</strong> {p.purpose}</>)} />
        <p>Some of these providers may process data outside the EU under standard contractual clauses or equivalent safeguards.</p>
      </Section>
      <Section title="How long we keep it">
        <div className="overflow-hidden rounded-2xl border">
          {RETENTION.map((r) => (
            <div key={r.data} className="grid gap-1 border-b p-3 last:border-0 sm:grid-cols-2">
              <span className="font-medium">{r.data}</span>
              <span className="text-muted-foreground">{r.period}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Legal basis">
        <p>
          We process your data to provide the service you signed up for (contract), to meet tax and consumer-law
          obligations (legal obligation), and to keep the service secure (legitimate interest).
        </p>
      </Section>
      <Section title="Your rights">
        <Bullets
          items={[
            <>Get a copy of your data — use <strong>Download my data</strong> in <Link to="/settings" className="font-semibold text-primary-deep">Settings</Link>.</>,
            <>Delete your account and data — use <strong>Delete account</strong> in Settings.</>,
            "Correct your details, object to or restrict processing, and move your data to another service.",
            <>Complain to the Data Protection Commission (Ireland) at dataprotection.ie. Please contact us first at {OPERATOR.email} so we can help.</>,
          ]}
        />
      </Section>
    </LegalPage>
  );
}
