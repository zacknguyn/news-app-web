declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-v3';
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export const loadRecaptchaScript = () =>
  new Promise<void>((resolve, reject) => {
    if (!siteKey) {
      resolve();
      return;
    }

    if (window.grecaptcha) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load reCAPTCHA.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load reCAPTCHA.'));
    document.head.appendChild(script);
  });

export const isRecaptchaConfigured = Boolean(siteKey);

export const executeRecaptcha = async (action: string) => {
  if (!siteKey) return undefined;

  await loadRecaptchaScript();

  return new Promise<string>((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error('reCAPTCHA is unavailable.'));
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error('reCAPTCHA verification failed.')));
    });
  });
};

export {};
