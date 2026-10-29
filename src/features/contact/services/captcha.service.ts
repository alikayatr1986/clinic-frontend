interface Recaptcha { ready(callback: () => void): void; execute(key: string, options: { action: string }): Promise<string> }
declare global { interface Window { grecaptcha?: Recaptcha } }

// Never cache a token: every attempt, including an API retry, calls execute again.
export function freshCaptchaToken(siteKey: string, action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('CAPTCHA unavailable')), 15000);
    const fail = () => { window.clearTimeout(timer); reject(new Error('CAPTCHA unavailable')); };
    const api = window.grecaptcha;
    if (!siteKey || !action || !api) { fail(); return; }
    try {
      api.ready(() => {
        try {
          api.execute(siteKey, { action }).then((token) => {
            window.clearTimeout(timer);
            if (!token || token.length > 4096) fail(); else resolve(token);
          }, fail);
        } catch { fail(); }
      });
    } catch { fail(); }
  });
}
