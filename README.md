# Inbox Scout Sidekick

Build a full-stack responsive web application for an AI Email Drafter & Smart Reply Assistant ("InboxHero") based on my attached brief, adapting its Node.js/Express backend to Lovable's supported backend.

"just more rounded no squares rounded squares with a interactive dashobaord and analytics and being able to look into each top page as a full screen" Use the attached dashboard and assistant images as design references, with cyan and white to fit the colour theme. Make the AI text box a small corner at the bottom so I’m able to ask it questions like “draft a email”.

"All 3" for lead sourcing: drafting only, import lead lists, and in-app lead search. Use an Apify actor for in-app business search. Include CSV import and manual contact entry. Filter out listings with existing website URLs. Users connect their own Gmail or Outlook mailbox, and each email requires individual review before sending.

Replace the draft-count plan pricing in the original brief with this credit system:
- 1 email generation request costs 50 credits and returns three distinct reply options. Charge per generation request, not per option.
- 1 AI question costs 50 credits.
- 1 lead scrape costs 100 credits.
- Free sign-up bonus: 1,000 credits, one time, never expire, with no monthly refill.
- Pro: €19/month, 15,000 credits per month.
- Business: €50/month, 50,000 credits per month.
- Subscription credits reset each month and unused subscription credits do not roll over.
- Top-up pack: €10 for 5,000 credits; purchased top-up credits carry over.
- Set hard spend limits by checking or reserving credits server-side before calling the AI or scraper API; restore credits if a request fails.

Set up Stripe payments for the subscription plans and top-up packs. Make the credit page resemble the attached image in cyan and white, with a separate mini tab for packages. Add points under the balance and package choices explaining what the credits cover, including the monthly reset versus top-up rollover rules.

Keep the rounded-card interactive dashboard, full-page top-level screens, analytics, and the AI assistant in scope.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a71b068e-d855-4fc2-9b45-d7e06c77c39c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
