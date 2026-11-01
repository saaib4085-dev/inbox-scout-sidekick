import LegalDoc from '@/components/legal/LegalDoc';
import { OPERATOR } from '@/lib/legal';

const sections = [
  {
    id: 'what-you-buy',
    title: 'What you are buying',
    paragraphs: [
      'InboxHero is sold as one-time plans that add a fixed number of credits and customer scrapes to your account — for example 1,000 credits and 300 scrapes on Pro. Credits are spent on AI usage at 15 credits per assistant message and 25 credits per sample draft; scrapes are spent one per customer found.',
      'Nothing is shipped. Credits exist only inside your InboxHero account.',
    ],
  },
  {
    id: 'instant-delivery',
    title: 'Instant delivery',
    paragraphs: [
      'Digital content delivery begins the moment your payment is confirmed. As soon as checkout completes, the credits in your pack are credited to your account and are immediately available to spend.',
      'Because delivery is instant, the pack has been fully performed from the moment the credits land in your balance.',
    ],
  },
  {
    id: 'withdrawal-right',
    title: 'The EU 14-day withdrawal right and its waiver',
    paragraphs: [
      'As an EU consumer you normally have 14 days from the day of purchase to withdraw from a distance contract without giving a reason.',
      'Digital content supplied immediately is the exception. Under Article 16(m) of Directive 2011/83/EU, that right of withdrawal is lost once delivery has begun, provided you gave your prior express consent to immediate delivery and acknowledged that you would lose the right.',
      'We ask for exactly that consent on the checkout page, above the payment button, and we do not let you pay until it is given. Your consent is recorded with a timestamp against your order.',
      'What this means in practice: once your credits are added to your account, the 14-day withdrawal right no longer applies, and the credit pack can no longer be cancelled or refunded on that basis.',
    ],
  },
  {
    id: 'refund-policy',
    title: 'Our refund policy',
    paragraphs: [
      'Credit packs are non-refundable once the credits have been delivered to your account, whether or not you have spent them. An unused credit balance is not refundable and has no cash value.',
      'Credits or customer scrapes already consumed by completed work are never refundable, because the AI processing has already been performed for you.',
    ],
  },
  {
    id: 'when-we-refund',
    title: 'When we do refund',
    paragraphs: [
      'We refund in full, or re-credit your account, where the problem is ours:',
    ],
    bullets: [
      'You were charged twice for the same order, or charged an amount different from the price shown at checkout.',
      'Payment succeeded but the credits never arrived in your account.',
      'The charge was made without your authorisation.',
      'A run failed because of an error on our side and consumed credits without producing leads — we restore those credits to your balance.',
      'A mandatory consumer right in your country of residence gives you a remedy that these terms cannot exclude.',
    ],
  },
  {
    id: 'how-to-request',
    title: 'How to request a refund',
    paragraphs: [
      `Email ${OPERATOR.supportEmail} with the order reference shown on the Data & account screen, or reply to the payment receipt email with the same reference. Include what went wrong and, where relevant, the run that failed.`,
      'We reply within 5 working days. Approved refunds are returned through the original payment method, normally within 14 days of approval, and the corresponding credits are removed from your account.',
    ],
  },
  {
    id: 'chargebacks',
    title: 'Chargebacks',
    paragraphs: [
      'Please contact us before opening a chargeback with your bank — most issues are resolved the same week. Accounts with an open chargeback are suspended while the dispute is investigated, and a chargeback raised after credits have been consumed may be contested with the consent record and delivery logs for that order.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paragraphs: [
      'We may update this policy as the product changes. The version that applies to your purchase is the one published on the date of that purchase.',
    ],
  },
];

export default function Refunds() {
  return (
    <LegalDoc
      current="/refunds"
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      intro="Credits are delivered the instant a payment is confirmed. This policy explains what that means for your right to cancel, and the cases in which we still refund."
      highlight="By confirming a purchase you expressly consent to immediate delivery of your credits and acknowledge that you lose your statutory 14-day EU right of withdrawal once they are added to your account. Credit packs are therefore non-refundable once delivered."
      sections={sections}
    />
  );
}