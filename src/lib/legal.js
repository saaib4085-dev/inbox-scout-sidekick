export const POLICY_UPDATED = '1 November 2026';
export const CONSENT_VERSION = '2026-11-01';

export const CONSENT_TEXT =
  'I agree to the Terms of Service and Privacy Policy. I explicitly consent to immediate delivery of my digital credit balance upon payment and acknowledge that I forfeit my statutory 14-day EU right of withdrawal once credits are added to my account.';

// Registered operator details shown on every legal page.
// Replace the bracketed values with your registered company information.
export const OPERATOR = {
  legalName: '[Registered company name]',
  address: '[Registered business address]',
  supportEmail: '[support email]',
};

export const OPERATOR_INCOMPLETE = Object.values(OPERATOR).some((value) => value.includes('['));