// Cloudflare Pages Function — receives the project enquiry form on
// contact.html and emails it through Gmail SMTP.
//
// Secrets (Cloudflare dashboard → Pages project → Settings → Variables and Secrets,
// or .dev.vars for local `wrangler pages dev`):
//   GMAIL_USER          the Gmail address that sends (and, by default, receives)
//   GMAIL_APP_PASSWORD  a Google app password for that account — never commit it
//   CONTACT_TO          optional: deliver somewhere other than GMAIL_USER
//   TURNSTILE_SECRET_KEY  secret for the "brandonspell.com contact form" Turnstile
//                         widget (Cloudflare dashboard → Turnstile); while it's
//                         unset, the Turnstile check is skipped
//
// Every outcome is a redirect back to contact.html with ?sent=1 or ?error=…
// for the page to report.
//
// Spam: obvious bots (honeypot filled, sent too fast, or the junk-token
// pattern) get a fake success so they don't adapt; everything else must pass
// Cloudflare Turnstile before an email goes out.

import { WorkerMailer } from 'worker-mailer';

const FIELDS = ['name', 'email', 'organization', 'project_type', 'budget', 'timeline', 'message'];
const LABELS = {
  name: 'Name',
  email: 'Email',
  organization: 'Church or organization',
  project_type: 'Project',
  budget: 'Budget',
  timeline: 'Timeline',
  message: 'Message',
};
const MAX_LENGTH = { message: 5000 }; // everything else is a short single line
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// contact.html records how long the page was open before sending; people
// take longer than this, form-filling bots don't (or don't run the script).
const MIN_FILL_MS = 3000;
// The 2026-10-02 spam: name and organization both one long run of capitals
// and digits, e.g. NATREGTEGH2738925NEYRTHYT.
const JUNK_TOKEN = /^[A-Z0-9]{12,}$/;

// Returns '' when the token passes, else Cloudflare's error codes (or a
// short reason), which go back in the X-Turnstile-Error response header.
async function turnstileError(token, secret, ip) {
  if (!token) return 'missing-input-response';
  const body = new FormData();
  body.append('secret', secret.trim()); // a pasted secret often carries a stray newline
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const outcome = await res.json();
    if (outcome.success === true) return '';
    const codes = (outcome['error-codes'] || []).join(',') || 'unknown';
    console.error('contact: turnstile rejected —', codes);
    return codes;
  } catch (err) {
    console.error('contact: turnstile check failed —', err && err.message);
    return 'siteverify-unreachable';
  }
}

function back(request, query, headers = {}) {
  const location = new URL('/contact?' + query + '#enquiry', request.url).toString();
  return new Response(null, { status: 303, headers: { Location: location, ...headers } });
}

// Single-line fields end up in mail headers (subject, reply-to), so strip
// line breaks to rule out header injection.
function clean(value, field) {
  const text = String(value ?? '').trim().slice(0, MAX_LENGTH[field] || 200);
  return field === 'message' ? text : text.replace(/[\r\n]+/g, ' ');
}

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'error=invalid');
  }

  const data = {};
  for (const field of FIELDS) data[field] = clean(form.get(field), field);
  // "What do you need?" is multi-select: one project_type entry per ticked box
  data.project_type = clean(form.getAll('project_type').join(', '), 'project_type');

  // Obvious bots: pretend it worked so they move on.
  const elapsed = Number(form.get('elapsed'));
  const junk = data.name === data.organization && JUNK_TOKEN.test(data.name);
  if (form.get('_gotcha') || !(elapsed >= MIN_FILL_MS) || junk) {
    console.log('contact: dropped as spam', { gotcha: !!form.get('_gotcha'), elapsed, junk });
    return back(request, 'sent=1');
  }

  if (!data.name || !data.message || !EMAIL_PATTERN.test(data.email)) {
    return back(request, 'error=invalid');
  }

  // Until the secret is added in Cloudflare the check is skipped (the bot
  // filters above still apply), so the form never stops working.
  if (!env.TURNSTILE_SECRET_KEY) {
    console.warn('contact: TURNSTILE_SECRET_KEY is not set, so the Turnstile check was skipped');
  } else {
    const token = String(form.get('cf-turnstile-response') || '');
    const failed = await turnstileError(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'));
    if (failed) return back(request, 'error=verify', { 'X-Turnstile-Error': failed });
  }

  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.error('contact: GMAIL_USER / GMAIL_APP_PASSWORD are not set');
    return back(request, 'error=send');
  }

  const body = FIELDS.filter((f) => f !== 'message')
    .map((f) => `${LABELS[f]}: ${data[f] || '—'}`)
    .join('\n') + `\n\n${data.message}\n`;

  let mailer;
  try {
    mailer = await WorkerMailer.connect({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      authType: 'plain',
      credentials: { username: env.GMAIL_USER, password: env.GMAIL_APP_PASSWORD },
      socketTimeoutMs: 10000,
      responseTimeoutMs: 10000,
    });
    await mailer.send({
      from: { name: 'brandonspell.com', email: env.GMAIL_USER },
      to: env.CONTACT_TO || env.GMAIL_USER,
      reply: { name: data.name, email: data.email },
      subject: `New project enquiry: ${data.name}${data.organization ? ' (' + data.organization + ')' : ''}`,
      text: body,
    });
  } catch (err) {
    console.error('contact: send failed —', err && err.message);
    return back(request, 'error=send');
  } finally {
    if (mailer) await mailer.close().catch(() => {});
  }

  return back(request, 'sent=1');
}
