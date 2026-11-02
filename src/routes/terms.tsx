import { createFileRoute, Link } from "@tanstack/react-router";
import { Bullets, LegalPage, Section } from "@/components/app/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — InboxHero" },
      { name: "description", content: "The terms for using InboxHero, including credits, payments, age requirements and acceptable use." },
      { property: "og:title", content: "Terms of Service — InboxHero" },
      { property: "og:description", content: "Terms for using InboxHero." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="By creating an account or buying credits you agree to these terms. They are governed by the laws of Ireland."
    >
      <Section title="The service">
        <p>
          InboxHero helps you draft emails and replies with AI, find and organise leads, and send reviewed emails from your
          own Gmail or Outlook. Every email must be reviewed and approved by you before it is sent. You are responsible for
          the content you send.
        </p>
      </Section>
      <Section title="Age and guardian consent">
        <p>
          You may use InboxHero if you are 13 or older. If you are under 18, you need permission from a parent or legal
          guardian before buying a plan or credits. By completing a purchase you confirm that you are 18 or older, or that
          your parent or legal guardian has agreed to it.
        </p>
      </Section>
      <Section title="Credits, plans and prices">
        <Bullets
          items={[
            "Prices are shown in euro and are the final amount you pay. We do not add transaction or card fees.",
            "Monthly plan credits reset at the start of each billing month and do not roll over.",
            "Top-up credits and the sign-up bonus carry over and never expire while your account is open.",
            "Credits are reserved when you start an AI or search request and returned automatically if the request fails.",
            "Subscriptions renew monthly until you cancel. You can cancel any time from Manage billing; your plan stays active until the end of the paid month.",
          ]}
        />
      </Section>
      <Section title="Right of withdrawal">
        <p>
          Credits are digital content delivered immediately. At checkout you ask us to start delivery straight away and
          acknowledge that you lose your 14-day EU right of withdrawal once credits are added. See our{" "}
          <Link to="/refunds" className="font-semibold text-primary-deep">Refund Policy</Link> for details.
        </p>
      </Section>
      <Section title="Acceptable use">
        <Bullets
          items={[
            "Do not send spam, unlawful, misleading or harassing messages.",
            "Follow email-marketing and data-protection laws when contacting leads.",
            "Do not try to break, overload or reverse-engineer the service.",
          ]}
        />
        <p>We may suspend accounts that break these rules.</p>
      </Section>
      <Section title="AI output">
        <p>
          AI drafts can contain mistakes. Check every draft before sending. We are not liable for content you choose to
          send. Nothing in these terms limits your statutory rights as a consumer.
        </p>
      </Section>
      <Section title="Ending your account">
        <p>You can delete your account at any time in Settings. Unused credits are not refunded when you delete your account.</p>
      </Section>
    </LegalPage>
  );
}
