import { createFileRoute } from "@tanstack/react-router";
import { Bullets, LegalPage, Section } from "@/components/app/LegalPage";
import { OPERATOR } from "@/lib/policies";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — InboxHero" },
      { name: "description", content: "Refunds, the 14-day right of withdrawal, and cancelling subscriptions on InboxHero." },
      { property: "og:title", content: "Refund Policy — InboxHero" },
      { property: "og:description", content: "Refunds and the 14-day right of withdrawal." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="Under EU consumer law you normally have 14 days to withdraw from an online purchase. Because InboxHero credits are delivered instantly, this right works differently."
    >
      <Section title="The 14-day right of withdrawal">
        <p>
          Before you pay, we ask you to tick a box agreeing that your credits are delivered immediately and that you lose
          your 14-day right of withdrawal once the credits are added to your account. Without that agreement we cannot
          complete the purchase.
        </p>
      </Section>
      <Section title="When you can get a refund">
        <Bullets
          items={[
            "If you were charged but your credits never arrived.",
            "If you were charged twice or the wrong amount.",
            "If the service is faulty and we cannot fix it — your statutory rights always apply.",
            "Failed AI or search requests are refunded to your credit balance automatically.",
          ]}
        />
      </Section>
      <Section title="Subscriptions">
        <p>
          You can cancel a monthly plan at any time from Manage billing on the Credits page. You keep your plan until the end
          of the month you paid for, and you will not be charged again. Part-months are not refunded.
        </p>
      </Section>
      <Section title="How to ask">
        <p>Email {OPERATOR.email} with your account email and the date of the payment. We reply within 5 working days.</p>
      </Section>
    </LegalPage>
  );
}
