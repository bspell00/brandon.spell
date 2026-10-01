// Cloudflare Pages Function — receives the project enquiry form on
// contact.html and emails it through Gmail SMTP.
//
// Secrets (Cloudflare dashboard → Pages project → Settings → Variables and Secrets,
// or .dev.vars for local `wrangler pages dev`):
//   GMAIL_USER          the Gmail address that sends (and, by default, receives)
//   GMAIL_APP_PASSWORD  a Google app password for that account — never commit it
//   CONTACT_TO          optional: deliver somewhere other than GMAIL_USER
//
// The form posts natively (no JS required), so every outcome is a redirect
// back to contact.html with ?sent=1 or ?error=… for the page to report.

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

function back(request, query) {
  return Response.redirect(new URL('/contact?' + query + '#enquiry', request.url).toString(), 303);
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

  // Honeypot: bots fill every field. Pretend it worked so they move on.
  if (form.get('_gotcha')) return back(request, 'sent=1');

  const data = {};
  for (const field of FIELDS) data[field] = clean(form.get(field), field);
  // "What do you need?" is multi-select: one project_type entry per ticked box
  data.project_type = clean(form.getAll('project_type').join(', '), 'project_type');

  if (!data.name || !data.message || !EMAIL_PATTERN.test(data.email)) {
    return back(request, 'error=invalid');
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
