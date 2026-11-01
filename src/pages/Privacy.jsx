import LegalDoc from '@/components/legal/LegalDoc';
import { OPERATOR } from '@/lib/legal';

const sections = [
  {
    id: 'overview',
    title: 'Who is responsible for your data',
    paragraphs: [
      `${OPERATOR.legalName} is the data controller for the personal data described here. This policy explains what we collect, why we hold it, who processes it on our behalf and the rights you have under the EU General Data Protection Regulation (GDPR).`,
      'It covers the website, the workspace and the checkout. It does not cover the tools of third parties you choose to connect to.',
    ],
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    bullets: [
      'Account data: your email address, your display name and the authentication identifiers created when you sign in.',
      'Workspace data: the buyer briefs you write, the prospects generated from them, and the status you assign to each lead.',
      'Billing data: which credit pack you bought, the amount, the currency, the order status and the timestamp of your checkout consent. Card details are handled by our payment provider and never reach our servers.',
      'Technical data: minimal security and error logs, such as timestamps and request identifiers, used to keep the service working and to detect abuse.',
    ],
    paragraphs: [
      'We do not buy contact lists, we do not run advertising trackers in the app, and we do not sell personal data to anyone.',
    ],
  },
  {
    id: 'where-stored',
    title: 'Where your data is stored',
    paragraphs: [
      'Your email address, authentication data and workspace records are stored securely in our managed cloud database and authentication service, provided by our application platform (Base44). Access is restricted by per-record permissions, so one account cannot read another account’s leads, credits or orders.',
      'Data is encrypted in transit and at rest, and access by our own team is limited to what is needed for support, security and billing.',
    ],
  },
  {
    id: 'ai-processing',
    title: 'AI processing of your inputs',
    paragraphs: [
      'When you start a scouting run, your buyer brief, together with the instructions that shape the run, is sent to third-party AI model providers (for example Anthropic and OpenAI) through our AI infrastructure provider, only to produce the leads, intent scores and draft replies you asked for.',
      'Those providers act as processors. Your inputs are not used by us to train models, and we do not use them for advertising. Provider-side retention is limited to what their enterprise terms allow for abuse monitoring; where a provider retains data for a short period, it is not used to build profiles of you or your prospects.',
      'Do not paste special category data (health, religion, political opinions, sexual orientation, biometric data) or other people’s sensitive personal data into a brief or into your workspace.',
    ],
  },
  {
    id: 'legal-basis',
    title: 'Why we may process your data',
    bullets: [
      'To provide the service you asked for: performance of our contract with you.',
      'To keep records of purchases and consent: performance of the contract and our legal obligation to keep accounting records.',
      'To secure the service, prevent abuse and fix errors: our legitimate interest in a safe, working product.',
      'To send service messages about your account or an order: performance of the contract.',
    ],
    paragraphs: [
      'We do not send marketing email without your separate consent, and you can withdraw any consent you have given at any time.',
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    paragraphs: [
      'Workspace data is kept while your account is open. When you erase your account, your briefs, leads, credit balance and profile are deleted from the live database as part of that request.',
      'Purchase records are kept for as long as tax and accounting law requires, even after an account is erased, but are reduced to the minimum needed for that purpose.',
      'Security logs are kept for a short period and then discarded.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your GDPR rights',
    paragraphs: [
      'You have the right to be informed, to access your data, to correct it, to erase it, to restrict or object to processing, and to receive a portable copy of the data you gave us.',
      'You can exercise the first three directly from the Data & account screen of the app: download a machine-readable export of your workspace, or press "Delete My Account & Data" to have your stored records, credits and account profile purged. We respond to any other request within one month.',
      `To exercise any of these rights, or to ask a question about this policy, write to ${OPERATOR.supportEmail}.`,
      'If you believe we have handled your data unlawfully you can complain to your national supervisory authority. In Ireland that is the Data Protection Commission.',
    ],
  },
  {
    id: 'account-deletion',
    title: 'Account deletion and the right to be forgotten',
    paragraphs: [
      'Deleting your account is self-service and immediate: the request purges your leads, your credit account, your order consents and your sign-in profile, so the workspace cannot be recovered afterwards.',
      'Where a purchase record must be retained for tax purposes, it is kept in the reduced form described above and is not used for anything else.',
    ],
  },
  {
    id: 'transfers',
    title: 'International transfers',
    paragraphs: [
      'Some of our processors operate outside the European Economic Area. Where that happens, transfers rely on the European Commission’s Standard Contractual Clauses and, where applicable, the EU–US Data Privacy Framework, together with technical measures such as encryption in transit.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    paragraphs: [
      'We use only what is necessary to keep you signed in and to remember short-lived interface state. We do not run advertising or cross-site tracking cookies in the app.',
    ],
  },
  {
    id: 'children',
    title: 'Children',
    paragraphs: [
      'The service is intended for adults. Anyone under 18 may only use it with the consent of a parent or legal guardian, who becomes responsible for the account and any purchase. We delete accounts we learn were created by a child without that consent.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paragraphs: [
      'When this policy changes we update the date at the top of the page and, for material changes, we tell you in the app before the change takes effect.',
    ],
  },
];

export default function Privacy() {
  return (
    <LegalDoc
      current="/privacy"
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains how InboxHero handles personal data under the GDPR: what we store, which processors we use, how long we keep it and how you exercise your rights."
      highlight="Your account data and workspace records live in our secure managed database. Your buyer briefs are processed by third-party AI providers only to generate your leads. You can export or erase everything from the Data & account screen."
      sections={sections}
    />
  );
}