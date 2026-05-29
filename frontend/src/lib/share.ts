import { toast } from 'sonner';

export type SharePayload = {
  title: string;
  text?: string;
  url: string;
  successMessage?: string;
};

export const absoluteShareUrl = (pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (typeof window === 'undefined') return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).toString();
};

export const shareContent = async ({ title, text, url, successMessage = 'Share link copied.' }: SharePayload) => {
  const shareUrl = absoluteShareUrl(url);
  const payload = { title, text, url: shareUrl };

  if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
    try {
      await navigator.share(payload);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
    }
  }

  if (!navigator.clipboard) {
    toast.error('Clipboard is not available in this browser.');
    return false;
  }

  const clipboardText = text ? `${text}\n\n${shareUrl}` : shareUrl;
  await navigator.clipboard.writeText(clipboardText);
  toast.success(successMessage);
  return true;
};

export const copyShareText = async (text: string, successMessage = 'Copied.') => {
  if (!navigator.clipboard) {
    toast.error('Clipboard is not available in this browser.');
    return false;
  }

  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
  return true;
};

export const shareViaDevice = async ({ title, text, url }: SharePayload) => {
  const shareUrl = absoluteShareUrl(url);
  const payload = { title, text, url: shareUrl };

  if (!navigator.share || (navigator.canShare && !navigator.canShare(payload))) {
    toast.error('Device sharing is not available in this browser.');
    return false;
  }

  try {
    await navigator.share(payload);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    toast.error('Unable to open share sheet.');
    return false;
  }
};

export const openEmailShare = ({ title, text, url }: SharePayload) => {
  const shareUrl = absoluteShareUrl(url);
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(text ? `${text}\n\n${shareUrl}` : shareUrl);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};
