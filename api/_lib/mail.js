/**
 * Resend email alerts for site errors.
 */

const { Resend } = require('resend');

function isEmailEnabled() {
  const flag = process.env.ERROR_EMAIL_ENABLED;
  if (flag === 'false' || flag === '0') return false;
  return Boolean(process.env.RESEND_API_KEY && process.env.ERROR_ALERT_TO && process.env.ERROR_ALERT_FROM);
}

function formatErrorEmail(error) {
  const lines = [
    'A user encountered an error on the palliative care site.',
    '',
    `Type: ${error.error_type || 'unknown'}`,
    error.status_code != null ? `HTTP status: ${error.status_code}` : null,
    error.failed_url ? `Failed URL: ${error.failed_url}` : null,
    error.link_text ? `Link text: ${error.link_text}` : null,
    error.page_url ? `Source page: ${error.page_url}` : null,
    error.occurred_at ? `Time: ${error.occurred_at}` : null,
    error.session_id ? `Session: ${error.session_id}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function sendErrorAlert(error) {
  if (!isEmailEnabled()) {
    return { sent: false, reason: 'disabled' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subjectParts = [error.error_type || 'site_error'];
  if (error.status_code != null) subjectParts.push(String(error.status_code));
  if (error.failed_url) {
    try {
      subjectParts.push(new URL(error.failed_url).pathname.slice(0, 80));
    } catch {
      subjectParts.push(String(error.failed_url).slice(0, 80));
    }
  }

  const { error: sendError } = await resend.emails.send({
    from: process.env.ERROR_ALERT_FROM,
    to: process.env.ERROR_ALERT_TO,
    subject: `[Site error] ${subjectParts.join(' — ')}`,
    text: formatErrorEmail(error),
  });

  if (sendError) {
    console.error('Error alert email failed:', sendError);
    return { sent: false, reason: sendError.message || 'send_failed' };
  }

  return { sent: true };
}

module.exports = {
  isEmailEnabled,
  sendErrorAlert,
};
