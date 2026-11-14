export const copyToClipboard = async (text) => {
  let clipboardError;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      clipboardError = error;
    }
  }

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  let copied = false;
  try {
    field.select();
    copied = document.execCommand('copy');
  } finally {
    field.remove();
  }

  if (!copied) {
    throw clipboardError || new Error('Clipboard access is unavailable.');
  }
};
