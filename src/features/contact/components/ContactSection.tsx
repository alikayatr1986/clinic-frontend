"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Script from 'next/script';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProcedures } from '@/features/procedures/hooks/useProcedures';
import { validateContact } from '@/features/contact/schemas/contact.schema';
import { isAbortError } from '@/lib/api';
import { ContactApiError } from '@/features/contact/services/contact.service';
import { freshCaptchaToken } from '@/features/contact/services/captcha.service';
import { useConsent } from '@/features/contact/hooks/useConsent';
import { useSubmitContact } from '@/features/contact/hooks/useSubmitContact';
import type {
  ContactCopyKey,
  ContactErrors,
  ContactSectionProps,
  ContactValues,
} from '@/features/contact/types/contact.types';

const emptyValues: ContactValues = { name: '', country: '', city: '', procedure: '', email: '', phone: '', preferred_contact: 'email', message: '' };
const selectClass = 'min-h-12 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-destructive';

export function ContactSection({ config }: ContactSectionProps) {
  const t = useTranslations('contact');
  const locale = useLocale() === 'ar' ? 'ar' : 'en';
  const { procedures, error: catalogError, retry: retryCatalog } = useProcedures();
  const { consent, error: consentError, retry: retryConsent } = useConsent(locale);
  const submitMutation = useSubmitContact();

  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [acceptedLocale, setAcceptedLocale] = useState<string | null>(null);
  const accepted = acceptedLocale === locale;
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactCopyKey | ''>('');
  const [captchaPending, setCaptchaPending] = useState(false);
  const [captchaState, setCaptchaState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const submitting = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const captchaConfigured = Boolean(config.captcha.siteKey && config.captcha.action);
  const locationsAvailable = config.countries.length > 0;
  const country = config.countries.find((item) => item.code === values.country);

  const busy = captchaPending || submitMutation.isPending;
  const success = submitMutation.isSuccess;

  function setAccepted(value: boolean) {
    setAcceptedLocale(value ? locale : null);
  }

  useEffect(() => {
    if (!captchaConfigured || captchaState !== 'loading') return;
    const timer = window.setTimeout(() => setCaptchaState('error'), 15000);
    return () => window.clearTimeout(timer);
  }, [captchaConfigured, captchaState, captchaAttempt]);

  function change<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value, ...(key === 'country' ? { city: '' } : {}) }));
    setErrors((previous) => ({ ...previous, [key]: undefined, ...(key === 'country' ? { city: undefined } : {}) }));
    if (submitMutation.isSuccess) {
      submitMutation.reset();
    }
  }

  function announce(message: ContactCopyKey) {
    setStatus(message);
    summary.current?.focus();
  }

  function retryDependencies() {
    setAccepted(false);
    void retryConsent();
    retryCatalog();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitMutation.reset();
    const invalid = validateContact(values, accepted, config.countries, procedures);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      announce('validationSummary');
      return;
    }
    if (!consent || consentError || catalogError || !procedures.length || !locationsAvailable) {
      announce('dependenciesUnavailable');
      return;
    }
    if (!captchaConfigured || captchaState !== 'ready') {
      announce('captchaUnavailable');
      return;
    }

    submitting.current = true;
    setCaptchaPending(true);
    setStatus('submitting');

    let token: string;
    try {
      token = await freshCaptchaToken(config.captcha.siteKey, config.captcha.action);
    } catch {
      announce('captchaUnavailable');
      submitting.current = false;
      setCaptchaPending(false);
      return;
    } finally {
      setCaptchaPending(false);
    }

    try {
      await submitMutation.mutateAsync({ values, consent, locale, token });
      setValues(emptyValues);
      setAccepted(false);
      setErrors({});
      announce('success');
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ContactApiError && error.code === 'CONSENT_REQUIRED') {
        setAccepted(false);
        void retryConsent();
        setErrors({ consent_accepted: 'requiredConsent' });
        announce('consentChanged');
      } else if (error instanceof ContactApiError && error.status === 403) {
        announce('challenge');
      } else if (error instanceof ContactApiError && error.status === 429) {
        announce('throttled');
      } else if (error instanceof ContactApiError && error.code === 'VALIDATION') {
        const serverErrors: ContactErrors = {};
        for (const field of error.fields) {
          if (field in emptyValues) serverErrors[field as keyof ContactValues] = 'serverField';
        }
        setErrors(serverErrors);
        announce('validationSummary');
      } else {
        announce('submitUnavailable');
      }
    } finally {
      submitting.current = false;
    }
  }

  function field(key: keyof ContactValues, control: ReactNode, help?: ContactCopyKey) {
    return <div className="grid min-w-0 content-start gap-2">
      <Label htmlFor={`contact-${key}`}>{t(key)}{key !== 'message' && <span aria-hidden="true" className="text-primary">*</span>}</Label>
      {control}
      {help && <p id={`contact-${key}-help`} className="text-sm leading-relaxed text-muted-foreground">{t(help)}</p>}
      {errors[key] && <p id={`contact-${key}-error`} className="text-sm text-destructive">{t(errors[key])}</p>}
    </div>;
  }

  function attributes(key: keyof ContactValues, help = false) {
    return { id: `contact-${key}`, name: key, required: key !== 'message', 'aria-invalid': Boolean(errors[key]), 'aria-describedby': [help ? `contact-${key}-help` : '', errors[key] ? `contact-${key}-error` : ''].filter(Boolean).join(' ') || undefined };
  }

  const information = [
    config.address && { Icon: MapPin, labelKey: 'location' as const, value: config.address[locale] },
    config.phone && { Icon: Phone, labelKey: 'publicPhone' as const, value: config.phone, href: `tel:${config.phone}` },
    config.email && { Icon: Mail, labelKey: 'publicEmail' as const, value: config.email, href: `mailto:${config.email}` },
  ].filter(Boolean);

  return <section id="contact" aria-labelledby="contact-heading" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="relative isolate scroll-mt-16 overflow-hidden lg:scroll-mt-20 bg-background py-16 text-foreground lg:py-24">
    <div aria-hidden="true" className="pointer-events-none absolute -end-52 -top-52 -z-10 size-[34rem] rounded-full border-[5rem] border-secondary/50" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-72 -start-72 -z-10 size-[34rem] rounded-full border-[5rem] border-secondary/40" />
    {captchaConfigured && <Script key={captchaAttempt} id={`contact-recaptcha-${captchaAttempt}`} src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(config.captcha.siteKey)}${captchaAttempt ? `&contact_retry=${captchaAttempt}` : ''}`} strategy="afterInteractive" onReady={() => setCaptchaState('ready')} onError={() => setCaptchaState('error')} />}
    <div className="mx-auto grid max-w-7xl min-w-0 items-start gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12 lg:px-8">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground after:h-px after:w-12 after:bg-primary">{t('eyebrow')}</p>
        <h2 id="contact-heading" className={`mt-5 text-balance text-[clamp(2.25rem,5vw,4.5rem)] font-normal ${locale === 'ar' ? '[font-family:var(--font-noto-arabic),sans-serif] leading-snug' : 'font-hero-display leading-[1.05]'}`}>{t('heading')}</h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('introduction')}</p>
      </div>
      <div className="min-w-0 rounded-2xl border border-border/50 bg-card p-5 shadow-xl shadow-foreground/5 sm:p-8 lg:col-start-2 lg:row-span-4 lg:row-start-1">
        <form noValidate onSubmit={submit} aria-label={t('formTitle')} aria-busy={busy}>
          <div ref={summary} tabIndex={-1} role={success ? 'status' : 'alert'} aria-live="polite" className={`break-words rounded-lg focus-visible:outline-2 focus-visible:outline-ring ${status ? 'mb-5 border border-border bg-secondary p-4' : ''}`}>
            {status && <p>{t(status)}</p>}
            {Object.entries(errors).some(([, value]) => value) && <ul className="mt-2 list-inside list-disc text-sm">
              {Object.entries(errors).filter(([, value]) => value).map(([key, value]) => <li key={key}><a className="underline underline-offset-2" href={`#contact-${key}`}>{t(key as keyof ContactErrors)}: {t(value!)}</a></li>)}
            </ul>}
          </div>
          <p className="mb-5 text-sm text-muted-foreground">{t('requiredHelp')}</p>
          {!locationsAvailable && <p role="status" className="mb-5 text-sm text-destructive">{t('locationsUnavailable')}</p>}
          {(consentError || catalogError) ? <div className="mb-5 grid gap-3" role="alert"><p>{t('dependenciesUnavailable')}</p><Button type="button" variant="outline" onClick={retryDependencies}>{t('retry')}</Button></div> : (!consent || !procedures.length) && <p role="status" className="mb-5 text-sm">{t('loading')}</p>}
          <fieldset disabled={busy} className="grid min-w-0 gap-5">
            <legend className="sr-only">{t('formTitle')}</legend>
            {field('name', <Input {...attributes('name')} autoComplete="name" maxLength={200} value={values.name} onChange={(event) => change('name', event.target.value)} />)}
            <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {field('country', <select {...attributes('country')} className={selectClass} autoComplete="country" value={values.country} disabled={!locationsAvailable} onChange={(event) => change('country', event.target.value)}><option value="">{t('selectCountry')}</option>{config.countries.map((item) => <option key={item.code} value={item.code}>{item[locale]}</option>)}</select>)}
              {field('city', <select {...attributes('city')} className={selectClass} autoComplete="address-level2" value={values.city} disabled={!country} onChange={(event) => change('city', event.target.value)}><option value="">{t('selectCity')}</option>{country?.cities.map((item) => <option key={item.code} value={item.code}>{item[locale]}</option>)}</select>)}
            </div>
            {field('procedure', <select {...attributes('procedure')} className={selectClass} disabled={!procedures.length || catalogError} value={values.procedure} onChange={(event) => change('procedure', event.target.value)}><option value="">{t('selectProcedure')}</option>{procedures.map((item) => <option key={item.code} value={item.code}>{item[locale]}</option>)}</select>)}
            {field('email', <Input {...attributes('email')} type="email" autoComplete="email" maxLength={254} dir="ltr" value={values.email} onChange={(event) => change('email', event.target.value)} />)}
            {field('phone', <Input {...attributes('phone', true)} type="tel" autoComplete="tel" maxLength={64} dir="ltr" value={values.phone} onChange={(event) => change('phone', event.target.value)} />, 'phoneHelp')}
            <fieldset id="contact-preferred_contact" aria-describedby={`contact-preference-help${errors.preferred_contact ? ' contact-preferred_contact-error' : ''}`} className="min-w-0">
              <legend className="mb-3 text-sm font-medium">{t('preferred_contact')} <span aria-hidden="true" className="text-primary">*</span></legend>
              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                {(['email', 'whatsapp', 'telegram'] as const).map((method) => <label key={method} className={`flex min-h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-3 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring ${values.preferred_contact === method ? 'border-primary bg-primary/5' : 'border-input'}`}>
                  <input type="radio" name="preferred_contact" value={method} checked={values.preferred_contact === method} required onChange={() => change('preferred_contact', method)} className="size-4 shrink-0 accent-primary" />
                  <span className="break-words">{t(`methods.${method}`)}</span>
                </label>)}
              </div>
              <p id="contact-preference-help" className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(values.preferred_contact === 'email' ? 'emailPreferenceHelp' : 'phonePreferenceHelp')}</p>
              {errors.preferred_contact && <p id="contact-preferred_contact-error" className="text-sm text-destructive">{t(errors.preferred_contact)}</p>}
            </fieldset>
            {field('message', <Textarea {...attributes('message')} rows={3} maxLength={5000} value={values.message} onChange={(event) => change('message', event.target.value)} />)}
            <div className="grid gap-2">
              {consent && <p id="contact-consent-text" className="whitespace-pre-wrap break-words rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed">{consent.text}</p>}
              <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2 text-sm leading-relaxed" htmlFor="contact-consent_accepted">
                <input id="contact-consent_accepted" type="checkbox" name="consent_accepted" checked={accepted} required disabled={!consent || consentError} onChange={(event) => { setAccepted(event.target.checked); setErrors((previous) => ({ ...previous, consent_accepted: undefined })); }} aria-invalid={Boolean(errors.consent_accepted)} aria-describedby={[consent ? 'contact-consent-text' : '', errors.consent_accepted ? 'contact-consent_accepted-error' : ''].filter(Boolean).join(' ') || undefined} className="mt-1 size-5 shrink-0 accent-primary" />
                <span>{t('consent_accepted')} <span aria-hidden="true" className="text-primary">*</span></span>
              </label>
              {errors.consent_accepted && <p id="contact-consent_accepted-error" className="text-sm text-destructive">{t(errors.consent_accepted)}</p>}
            </div>
            <div className="grid"><Button type="submit" size="hero" disabled={busy || !consent || consentError || catalogError || !procedures.length || !locationsAvailable || !captchaConfigured || captchaState !== 'ready' || success}>{t(busy ? 'submitting' : 'submit')}</Button></div>
          </fieldset>
          {!captchaConfigured || captchaState === 'error' ? <div className="mt-4 grid gap-3" role="status"><p className="text-sm text-destructive">{t('captchaUnavailable')}</p>{captchaConfigured && <Button type="button" variant="outline" onClick={() => { setCaptchaState('loading'); setCaptchaAttempt((value) => value + 1); }}>{t('retryCaptcha')}</Button>}</div> : captchaState === 'loading' && <p role="status" className="mt-3 text-sm text-muted-foreground">{t('captchaLoading')}</p>}
        </form>
      </div>
      <ul className="grid min-w-0 gap-5 sm:grid-cols-3 lg:col-start-1 lg:row-start-4">
        {(['trustChoice', 'trustConsent', 'trustContact'] as const).map((key) => <li key={key} className="text-center text-sm leading-relaxed"><ShieldCheck aria-hidden="true" className="mx-auto mb-3 size-8 text-primary" /><h3 className="font-semibold">{t(`${key}Title`)}</h3><p className="mt-2 text-muted-foreground">{t(key)}</p></li>)}
      </ul>
      {(config.whatsapp || config.telegram) && <div className="min-w-0 rounded-2xl border border-border/50 bg-card p-5 shadow-sm lg:col-start-1 lg:row-start-2">
        <h3 className="text-xl font-semibold">{t('directTitle')}</h3><p className="mt-2 text-sm text-muted-foreground">{t('directHelp')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{(['whatsapp', 'telegram'] as const).map((method) => config[method] && <a key={method} href={config[method]} target="_blank" rel="noopener noreferrer" className="flex min-h-16 min-w-0 items-center justify-center rounded-lg border border-border p-4 text-center font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{t(`direct.${method}`)}<span className="sr-only"> {t('newWindow')}</span></a>)}</div>
      </div>}
      {information.length > 0 && <div className="grid min-w-0 gap-6 rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:grid-cols-3 lg:col-start-1 lg:row-start-3">{information.map((item) => item && <div key={item.labelKey} className="min-w-0 text-center"><item.Icon aria-hidden="true" className="mx-auto mb-3 size-6 text-primary" /><h3 className="text-sm font-semibold">{t(item.labelKey)}</h3><p className="mt-2 break-words text-sm text-muted-foreground">{item.href ? <a href={item.href} dir="ltr" className="underline underline-offset-4">{item.value}</a> : item.value}</p></div>)}</div>}
    </div>
  </section>;
}
