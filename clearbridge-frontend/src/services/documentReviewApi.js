// Development uploads must use Vite's proxy, even with a configured API URL.
// A direct loopback request from a LAN page can fail CORS or target another device.
export const AI_API_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_AI_API_URL || '').replace(/\/+$/, '');

export async function reviewDocument(file) {
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  const isPhoto = ['jpg', 'jpeg', 'png', 'webp'].includes(extension);
  if (extension !== 'pdf' && !isPhoto) {
    throw new Error('Choose a PDF, JPEG, PNG, or WebP document.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Maximum document size is 10 MB.');
  }
  if (!file.size) throw new Error('This attachment is empty. Please choose another document.');

  const formData = new FormData();
  formData.append('file', file);
  let response;
  try {
    response = await fetch(`${AI_API_URL}/api/${isPhoto ? 'analyze-image' : 'analyze-document'}`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('Document review is taking longer than expected. Please try again.');
    }
    throw new Error('Cannot connect to document review. Check your connection and that the document-review service is running, then try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (typeof data?.detail === 'string') throw new Error(data.detail);
    if (response.status >= 500) {
      throw new Error('The document-review service is unavailable. Please try again after the service is running.');
    }
    throw new Error(`The document could not be reviewed (${response.status}). Please choose a readable PDF and try again.`);
  }
  if (typeof data?.document_type !== 'string' || typeof data?.status !== 'string' ||
      !data.extracted_fields || typeof data.extracted_fields !== 'object' || Array.isArray(data.extracted_fields)) {
    throw new Error('The document-review service returned an unexpected response. Please try again.');
  }
  return data;
}
