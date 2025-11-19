import { Modal } from 'antd';

/**
 * Very simple, reusable error popup
 * @param {any} err - Error object / string / HTTP response wrapper
 * @param {Object} [cfg] - Optional config
 * @param {string} [cfg.title='Operation failed'] - Modal title
 * @param {string} [cfg.okText='OK'] - Button text
 * @param {boolean} [cfg.destroyBefore=true] - Whether to close existing modals first
 */
export function showError(err, cfg) {
  cfg = cfg || {};

  // Title / button text (avoid using default values in destructuring)
  const title = typeof cfg.title === 'string' ? cfg.title : 'Operation failed';
  const okText = typeof cfg.okText === 'string' ? cfg.okText : 'OK';

  // Avoid stacking multiple error modals:
  // by default, clear all existing ones; pass { destroyBefore: false } to skip
  if (cfg.destroyBefore !== false) {
    Modal.destroyAll();
  }

  const n = normalizeError(err);

  // Use plain string instead of JSX.
  // If we have detail, show it under the main message.
  const content = n.detail ? n.message + '\n\n' + n.detail : n.message;

  Modal.error({
    title: title,
    content: content,
    okText: okText,
    centered: true,
    maskClosable: true,
    width: 520,
    // Allow passing extra antd Modal options
    // (but try not to override the required ones above)
    ...cfg,
  });
}

/**
 * Normalise different error shapes into a simple { message, detail } form
 * @param {any} err
 * @returns {{ message: string, detail?: string }}
 */
function normalizeError(err) {
  // If it's already a string, just use it as the message
  if (typeof err === 'string') {
    return { message: err };
  }

  // Try to extract HTTP status from common error wrappers
  const status = err && (err.status || (err.response && err.response.status));

  // Try to extract error message from typical API shapes
  const apiMsg =
    (err && (err.error || (err.data && err.data.error))) ||
    (err &&
      err.response &&
      err.response.data &&
      (err.response.data.error || err.response.data.message));

  // Fallback order for the main message
  const baseMsg = apiMsg || (err && err.message) || 'Unexpected error';

  // If we have an HTTP status, include it
  const message = status ? 'HTTP ' + status + ': ' + baseMsg : baseMsg;

  // Try to extract detail information (stack trace or API "details" field)
  let detail =
    (err &&
      (err.stack ||
        (err.data && err.data.details) ||
        (err.response && err.response.data && err.response.data.details))) ||
    undefined;

  // If it's a plain object, try to add its JSON string as extra detail
  if (!detail && err && typeof err === 'object') {
    try {
      const json = JSON.stringify(err, null, 2);
      if (json && json !== '{}') detail = json;
    } catch (_) {
      console.log('error');
    }
  }

  return { message: String(message), detail: detail };
}
