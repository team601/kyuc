**KYUC°**

Website Optimization Audit

Security • Workflow • SEO • Performance • GEO

[<u>https://kyuc.alignlab.com/</u>](https://kyuc.alignlab.com/)

Audit type: public-facing product/website review  
Date: 29 September 2026  
Status: Pre-launch / staging optimization

**Goal: make Kyuc safer, clearer, easier to use, more discoverable in search, and ready for real family recordings.**

# 1. Executive Summary

**Overall direction:** Kyuc has a strong emotional proposition and a low-friction “try recording first” concept. The main launch risks are privacy/security trust, saving recordings across signup, incomplete technical SEO, and insufficient explanation of what the user gets after creating an account.

**Important audit boundary:** this report separates what can be observed from the public interface from items that require backend/server verification. A public website review cannot confirm database rules, encryption-at-rest, storage ACLs, session implementation, backup procedures, or internal logging.

| **Priority** | **Action**                                  | **Why it matters**                                                                                                   | **Owner**         |
|--------------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------|-------------------|
| **P0**       | Privacy/Terms + secure data ownership model | Kyuc stores highly personal family stories and voice recordings. Trust and access control are product-critical.      | Product + Dev     |
| **P0**       | Record → signup → auto-save                 | The current try-before-signup idea is strong, but no recording should be lost when the user creates an account.      | Product + Dev     |
| **P0**       | Authentication recovery + session hardening | Users need password reset, verified identities, secure session cookies, abuse protection, and safe account deletion. | Dev               |
| **P1**       | Separate EN/VI SEO architecture             | Bilingual content should have crawlable language URLs, hreflang and localized metadata.                              | SEO + Dev         |
| **P1**       | Explain the product outcome                 | Visitors should understand voice + transcript + polished story + private archive within seconds.                     | Product + Content |
| **P2**       | Content/GEO engine                          | Question libraries and educational pages can build organic search and LLM visibility.                                | SEO + Content     |

# 2. Recommended Target Experience

**Core behavior to optimize:** Ask → Record → Save → Organize → Return.

| **Step**              | **Recommended behavior**                                                                                 |
|-----------------------|----------------------------------------------------------------------------------------------------------|
| 1\. Landing page      | Primary CTA: “Record your first story.” Let visitors experience value before signup.                     |
| 2\. Choose language   | English / Tiếng Việt; remember the preference and load localized prompts.                                |
| 3\. Choose a question | Curated prompts by Roots, Childhood, Family, Traditions, Love, Work, Migration, Life Lessons.            |
| 4\. Record or write   | Allow microphone recording and text. Show microphone permission context before asking the browser.       |
| 5\. Preview           | Play back audio, show draft transcript if available, and confirm “Your first memory is ready.”           |
| 6\. Save memory       | Only now ask for Google or email signup. Keep the draft token/session so the recording follows the user. |
| 7\. Dashboard         | Show one clear next action: today’s question for Mom/Dad/Grandparent.                                    |
| 8\. Return loop       | Weekly prompt, family invite, reminders, and export/book milestones.                                     |

# 3. Security & Privacy Audit

Priority principle: Kyuc should be “private by default.” Family stories, identities and voice recordings are sensitive personal data even when they are not legally classified as special-category data in every jurisdiction.

## 3.1 Legal + user trust pages — P0

- Create dedicated /privacy, /terms and /security (or /data-security) pages before inviting real users.

- Explain what is collected: account profile, audio, transcript, edited story, photos, invite relationships, device/analytics data.

- Explain where recordings are stored, how long deleted content is retained, and how users can export/delete their data.

- If AI services are used for transcription, rewriting or summarization, name the processing purpose and identify relevant subprocessors in the privacy documentation.

- Clarify whether user content is used to train any AI models. Make this answer easy to find.

- Add a short trust summary on the homepage and a detailed privacy page for users who want more information.

## 3.2 Storage + authorization — P0

- Use private object storage for audio/photos. Avoid permanent public URLs.

- Serve media through authenticated endpoints or short-lived signed URLs.

- Every story, recording, transcript and family invite must be checked against the authenticated user/family membership on the server; never trust only a front-end ID.

- If using Supabase/Firebase or a similar BaaS, enable database/storage security rules or Row Level Security and test cross-account access explicitly.

- Define roles: owner, contributor, viewer, invited guest. Default new memories to owner-only until intentionally shared.

- Protect export and delete operations with recent authentication.

## 3.3 Authentication + abuse protection — P0

- Add email verification, forgot password, reset password and change-password flows.

- Use secure, HttpOnly, SameSite cookies for sessions where possible; avoid storing durable auth tokens in localStorage.

- Rate-limit login, signup, password reset, upload, transcription and invite endpoints.

- Prevent email enumeration by returning neutral messages for account recovery.

- For Google OAuth, use the platform’s recommended state/PKCE protections and restrict allowed redirect URIs.

- Rotate/expire sessions and provide “sign out all devices” if accounts may contain years of family history.

## 3.4 Browser + server security headers — P0/P1

Dev should verify production response headers. Recommended baseline:

Strict-Transport-Security: max-age=31536000; includeSubDomains  
Content-Security-Policy: ...  
X-Content-Type-Options: nosniff  
Referrer-Policy: strict-origin-when-cross-origin  
Permissions-Policy: microphone=(self), camera=()

## 3.5 Upload + API safety — P1

- Allowlist file types and validate content server-side; do not trust filename extensions.

- Set reasonable file size and recording duration limits; reject oversized payloads early.

- Strip dangerous metadata where appropriate and generate safe server-side filenames.

- Use CSRF protection for cookie-authenticated state-changing requests.

- Log security-relevant events without logging raw story content or access tokens.

- Back up user content and test restore procedures; document deletion propagation to backups.

## 3.6 Security acceptance tests

| **Check**                  | **Acceptance criteria**                                                                   | **Priority** | **Status** |
|----------------------------|-------------------------------------------------------------------------------------------|--------------|------------|
| Cross-account story access | User A cannot open, guess or fetch User B recording/story by changing an ID or URL.       | **P0**       | ☐          |
| Private media URL          | Copied audio URL expires or requires authorization; it is not a permanent public asset.   | **P0**       | ☐          |
| Account recovery           | Forgot/reset password works without exposing whether an email exists.                     | **P0**       | ☐          |
| Delete account             | Deletion removes active data, revokes sessions and follows documented retention rules.    | **P0**       | ☐          |
| Rate limiting              | Repeated login/reset/upload abuse receives throttling without affecting normal users.     | **P1**       | ☐          |
| Headers                    | HSTS, CSP, nosniff, referrer policy and microphone permissions are present in production. | **P1**       | ☐          |

# 4. Workflow & Product UX

## 4.1 Keep try-before-signup — but make saving seamless

The existing low-friction idea is a strong differentiator. The key implementation requirement is continuity: the user should never have to re-record after signup.

- Generate a temporary draft ID before authentication.

- Upload/store the draft safely or keep a recoverable local draft with an explicit expiry window.

- After signup/login, claim the draft into the new account automatically.

- Confirm success: “Saved to your family archive.”

- If auto-save fails, keep the local recording and provide retry/download. Never silently discard it.

## 4.2 Recommended onboarding

1.  Who are you preserving stories for? Myself / Mom / Dad / Grandparent / Someone else.

2.  Preferred language: English / Tiếng Việt.

3.  How will you collect stories? Record together / Send a question / Weekly prompt.

4.  Ask notification permission only after the user understands the value; do not ask at first page load.

## 4.3 “Send a question” guest flow — high-value feature

A family member should be able to invite an older relative to answer one question without creating a full account. Recommended flow:

5.  Owner chooses a question and recipient.

6.  Kyuc creates an expiring invite link with scoped permission to answer only that prompt.

7.  Recipient sees the sender name, question and a large “Hold to record” or “Start recording” action.

8.  Recipient reviews and submits the answer.

9.  Owner is notified and can add the answer to the family archive.

10. Invite link expires after submission or a defined period; it should not expose the rest of the family archive.

## 4.4 Dashboard hierarchy

Avoid turning the dashboard into an admin panel. The top of the screen should answer one question: “What should I do next?”

- Today’s / this week’s question

- Primary “Record with Mom” or “Send this question” CTA

- Recent memories

- Progress: stories saved, people invited, recordings captured

- Export / printed book milestone later in the journey

## 4.5 Empty, error and permission states

- Microphone blocked: explain how to enable it and offer “Write instead.”

- Upload interrupted: keep local draft and show retry.

- Transcription processing: show status, not a blank screen.

- No stories yet: show one recommended question rather than an empty library.

- Invite expired: allow the owner to resend; do not reveal private family content.

# 5. SEO & Information Architecture

## 5.1 Clarify search intent on the homepage — P1

Keep the emotional brand tone, but add a descriptive line so search engines and new visitors immediately understand the product.

**Suggested title:** Kyuc — Record & Preserve Family Stories in Their Own Voice

**Suggested H1:** Record their stories. Keep their voices forever.

**Suggested supporting copy:** Kyuc helps families record and preserve the stories of parents and grandparents, one thoughtful question at a time.

**Suggested meta description:** Record your parents’ and grandparents’ stories with guided questions, voice recordings and written memories. Preserve your family history in English or Vietnamese.

## 5.2 Recommended SEO URL architecture

| **URL**                         | **Purpose**                  | **Primary intent**                                  |
|---------------------------------|------------------------------|-----------------------------------------------------|
| /en/                            | English homepage             | family story app; preserve family stories           |
| /vi/                            | Vietnamese homepage          | lưu giữ ký ức gia đình; ghi lại câu chuyện gia đình |
| /en/questions-for-grandparents/ | Grandparent question library | questions to ask grandparents                       |
| /vi/cau-hoi-danh-cho-ong-ba/    | Vietnamese question library  | câu hỏi dành cho ông bà                             |
| /en/record-family-stories/      | Use-case landing page        | record family stories                               |
| /en/oral-history-app/           | Category landing page        | oral history app                                    |
| /en/family-voice-recordings/    | Use-case landing page        | record family voices                                |
| /how-it-works/                  | Product explanation          | how to record family stories                        |
| /security/                      | Trust page                   | private family story app; data privacy              |

## 5.3 Bilingual technical SEO

- Use distinct crawlable URLs for English and Vietnamese rather than only a JavaScript language toggle.

- Add hreflang="en", hreflang="vi" and x-default equivalents between localized pages.

- Localize title, description, headings, body copy, FAQs and structured data—not only navigation labels.

- Use self-referencing canonical URLs on each localized page unless there is a deliberate canonicalization strategy.

- Do not auto-redirect search crawlers based only on browser language.

## 5.4 Indexation rules

Public marketing pages should be indexable. Private/product utility routes should generally be noindex and/or inaccessible to crawlers.

- Index: homepage, how-it-works, security/privacy summary, question libraries, educational landing pages and approved blog/resources.

- Noindex: /login, /signup, /account, /dashboard, private story pages, family invite management, internal search results.

- Keep staging noindex and/or password-protected. Remove staging controls only when production is ready.

- Generate XML sitemap(s), robots.txt and submit production to Google Search Console and Bing Webmaster Tools.

## 5.5 Structured data

- Organization or WebSite schema on the public site.

- SoftwareApplication/WebApplication schema where the product description accurately matches the implementation.

- FAQPage schema only when FAQs are visible on the page and comply with current search guidelines.

- BreadcrumbList on deep content sections.

- Article schema for educational resources.

# 6. Performance, Accessibility & Analytics

## 6.1 Performance

- Compress images to WebP/AVIF where appropriate and provide responsive srcset sizes.

- Preload only critical fonts/assets; remove unused font weights.

- Lazy-load below-the-fold imagery and defer non-critical scripts.

- Keep recording/transcription libraries out of the initial marketing bundle if they are not needed until interaction.

- Monitor Core Web Vitals separately on mobile. Target LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 for the 75th percentile where feasible.

- Use a CDN and production caching strategy for static assets; never cache authenticated private responses publicly.

## 6.2 Accessibility

- All recording controls must be keyboard accessible and have clear accessible names.

- Do not communicate record/pause/error state through color alone.

- Provide transcript/captions for audio playback where available.

- Ensure sufficient contrast, visible focus states and touch targets around 44×44 CSS px.

- Use semantic headings in logical order and meaningful alt text for content images.

- Announce upload/transcription progress to assistive technologies.

## 6.3 Analytics / product events

Track the funnel without sending raw story text/audio or sensitive personal content into analytics tools.

| **Event**         | **Purpose**                              |
|-------------------|------------------------------------------|
| landing_view      | Marketing visit                          |
| question_selected | Question chosen                          |
| record_start      | Recording started                        |
| record_complete   | Recording completed                      |
| save_clicked      | User decides to save                     |
| signup_started    | Signup begins                            |
| signup_complete   | Account created                          |
| draft_claimed     | Pre-signup recording attached to account |
| story_saved       | Story stored successfully                |
| invite_sent       | Question invite sent                     |
| invite_answered   | Guest answer returned                    |

# 7. Homepage Content Recommendations

**Hero** — H1: “Record their stories. Keep their voices forever.”  
Supporting copy: explain parents/grandparents + guided questions + voice.  
Primary CTA: “Record your first story.”

**How it works** — Ask → Record → Keep. Add one sentence under each explaining the actual product behavior.

**What Kyuc keeps** — Original voice • Transcript • Polished story • Photos • Private family archive • Export/book later.

**Use cases** — Stories from Mom / Dad / Grandparents / Immigration / Family recipes / Traditions / Life lessons.

**Privacy trust** — Private by default • You control sharing • Download/export • Delete anytime.

**Sample prompts** — Show 6–8 high-emotion questions so visitors immediately understand the experience.

**Bilingual value** — Explain that families can preserve stories in English or Vietnamese rather than showing only a language switch.

**Final CTA** — “Start with one story.” Reinforce no credit card if applicable and avoid “free forever” unless that promise is guaranteed.

# 8. 30-Day Implementation Roadmap

| **Timing**                          | **Deliverables**                                                                                                              |
|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Week 1 — Security foundation        | Privacy/Terms/Security pages; auth recovery; storage ACL/RLS review; staging noindex; secure session and rate-limit review.   |
| Week 2 — Core recording flow        | Pre-auth draft ID; recording preview; signup claim; failure recovery; account deletion/export; microphone permission UX.      |
| Week 3 — SEO + content architecture | /en/ and /vi/ structure; metadata; canonical/hreflang; sitemap/robots; schema; Search Console/Bing; homepage content updates. |
| Week 4 — Growth + measurement       | Analytics funnel; question libraries; send-a-question guest flow MVP; performance pass; accessibility QA; launch checklist.   |

# 9. Launch Acceptance Checklist

| **Check**            | **Acceptance criteria**                                                           | **Priority** | **Status** |
|----------------------|-----------------------------------------------------------------------------------|--------------|------------|
| Legal pages live     | Privacy, Terms and Security/Data page are public and linked from signup/footer.   | **P0**       | ☐          |
| Staging protected    | Staging is noindex/password protected and production canonical is correct.        | **P0**       | ☐          |
| Secure story access  | Cross-account ID/URL manipulation cannot expose stories or audio.                 | **P0**       | ☐          |
| Recording continuity | A pre-signup recording survives signup and appears in the new account.            | **P0**       | ☐          |
| Recovery flows       | Verify email + forgot/reset password work end to end.                             | **P0**       | ☐          |
| Delete/export        | User can export content and request account/data deletion.                        | **P0**       | ☐          |
| EN/VI SEO            | Language URLs, metadata, canonical and hreflang are correct.                      | **P1**       | ☐          |
| Sitemap/robots       | Valid sitemap and robots.txt are deployed to production.                          | **P1**       | ☐          |
| Private routes       | Login/account/dashboard/private story routes are noindex or non-crawlable.        | **P1**       | ☐          |
| Performance          | No major mobile CWV regressions; heavy recording code is deferred where possible. | **P1**       | ☐          |
| Accessibility        | Keyboard, focus, labels, contrast and recording state are tested.                 | **P1**       | ☐          |
| Analytics privacy    | Funnel events work without sending raw story/voice content to analytics.          | **P1**       | ☐          |

# 10. Suggested Success Metrics

| **Metric**           | **Definition**                                                                       |
|----------------------|--------------------------------------------------------------------------------------|
| Activation           | % of landing visitors who start a first recording                                    |
| Recording completion | % of record starts reaching a completed recording                                    |
| Save intent          | % of completed recordings where “Save this memory” is clicked                        |
| Signup conversion    | % of save-intent users who finish signup                                             |
| Draft claim success  | % of signups where the pre-auth recording is successfully attached                   |
| Week-1 return        | % of activated users who add another story within 7 days                             |
| Family loop          | % of activated users who send at least one question/invite                           |
| Organic growth       | Indexed public pages, non-brand impressions, clicks and qualified signup conversions |

# 11. Reference Standards

- OWASP Session Management Cheat Sheet: [<u>https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html</u>](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

- OWASP HTTP Headers Cheat Sheet: [<u>https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html</u>](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

- Google Search: localized versions / hreflang: [<u>https://developers.google.com/search/docs/specialty/international/localized-versions</u>](https://developers.google.com/search/docs/specialty/international/localized-versions)

- Google Search: robots meta tag: [<u>https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag</u>](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

- Google Search: canonical URLs: [<u>https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls</u>](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

- Web Content Accessibility Guidelines (WCAG): [<u>https://www.w3.org/WAI/standards-guidelines/wcag/</u>](https://www.w3.org/WAI/standards-guidelines/wcag/)

**Recommended next step:** turn the P0/P1 items into Jira/ClickUp tickets with owner, acceptance criteria and launch dependency. The acceptance checklist in this document is written so the team can use it directly for QA.
