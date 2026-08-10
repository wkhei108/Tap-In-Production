'use client';

import { useId, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import {
  budgetOptions,
  createContactSchema,
  projectTypeOptions,
  referralOptions,
  serviceOptions,
  toFieldErrors,
  type ContactField,
} from '@/lib/contact-schema';
import { getDictionary } from '@/content/dictionaries';
import { pathFor, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const emptyForm = {
  name: '',
  organisation: '',
  email: '',
  phone: '',
  service: '',
  projectType: '',
  preferredDate: '',
  budget: '',
  referral: '',
  details: '',
  consent: false,
  website: '',
};

type FormState = typeof emptyForm;

export default function ContactForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.contact.form;
  const options = dict.contact.options;

  const [values, setValues] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMessage, setServerMessage] = useState<string>('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const fieldId = (name: string) => `${baseId}-${name}`;
  const errorId = (name: string) => `${baseId}-${name}-error`;
  const hintId = (name: string) => `${baseId}-${name}-hint`;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the error as soon as the visitor starts fixing the field.
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as ContactField];
      return next;
    });
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerMessage('');

    const payload = { ...values, locale };
    const parsed = createContactSchema(locale).safeParse(payload);

    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setStatus('idle');
      // Move the visitor to the summary rather than leaving them guessing.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data: {
        ok?: boolean;
        message?: string;
        fieldErrors?: Partial<Record<ContactField, string>>;
      } = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerMessage(data.message ?? dict.contact.validation.serverError);
        setStatus('error');
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }

      // Only a genuine delivery clears the form.
      setValues(emptyForm);
      setStatus('success');
    } catch {
      setServerMessage(dict.contact.validation.serverError);
      setStatus('error');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  if (status === 'success') {
    return (
      <div
        className="border border-lime/40 bg-surface/60 p-8 md:p-10"
        role="status"
        aria-live="polite"
      >
        <CircleCheck aria-hidden="true" className="size-8 text-lime" />
        <h2
          className={cn(
            locale === 'zh-hk' ? 'display-cjk' : 'display',
            'mt-5 text-display-sm',
          )}
        >
          {t.successTitle}
        </h2>
        <p className="mt-3 max-w-[52ch] text-mute">{t.successBody}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="tap mt-8 inline-flex items-center rounded-xs border border-line px-5 py-3 text-sm font-semibold text-bone transition-colors hover:border-lime hover:text-lime"
        >
          {t.successAgain}
        </button>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const submitting = status === 'submitting';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <h2
        className={cn(locale === 'zh-hk' ? 'display-cjk' : 'display', 'text-display-sm')}
      >
        {t.heading}
      </h2>

      {/* Error / failure summary — focusable so it can receive focus on submit */}
      <div
        ref={summaryRef}
        tabIndex={-1}
        role={hasErrors || status === 'error' ? 'alert' : undefined}
        className={cn(
          'focus:outline-none',
          (hasErrors || status === 'error') &&
            'flex flex-col gap-2 border border-red-400/50 bg-red-950/25 p-4',
        )}
      >
        {status === 'error' ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
              {t.errorTitle}
            </p>
            <p className="text-sm text-red-100/80">{serverMessage || t.errorBody}</p>
          </>
        ) : hasErrors ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-red-200">
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
            {t.validationTitle}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id={fieldId('name')}
          label={t.name}
          required
          error={errors.name}
          errorId={errorId('name')}
          errorPrefix={t.fieldError}
        >
          <input
            id={fieldId('name')}
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId('name') : undefined}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field
          id={fieldId('organisation')}
          label={t.organisation}
          required
          error={errors.organisation}
          errorId={errorId('organisation')}
          errorPrefix={t.fieldError}
        >
          <input
            id={fieldId('organisation')}
            name="organisation"
            type="text"
            autoComplete="organization"
            value={values.organisation}
            onChange={(e) => update('organisation', e.target.value)}
            aria-invalid={errors.organisation ? true : undefined}
            aria-describedby={errors.organisation ? errorId('organisation') : undefined}
            className={inputClass(Boolean(errors.organisation))}
          />
        </Field>

        <Field
          id={fieldId('email')}
          label={t.email}
          required
          error={errors.email}
          errorId={errorId('email')}
          errorPrefix={t.fieldError}
        >
          <input
            id={fieldId('email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errorId('email') : undefined}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>

        <Field
          id={fieldId('phone')}
          label={t.phone}
          optionalLabel={t.optional}
          error={errors.phone}
          errorId={errorId('phone')}
          errorPrefix={t.fieldError}
        >
          <input
            id={fieldId('phone')}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? errorId('phone') : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>

        <Field
          id={fieldId('service')}
          label={t.serviceInterest}
          required
          error={errors.service}
          errorId={errorId('service')}
          errorPrefix={t.fieldError}
        >
          <select
            id={fieldId('service')}
            name="service"
            value={values.service}
            onChange={(e) => update('service', e.target.value)}
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? errorId('service') : undefined}
            className={inputClass(Boolean(errors.service))}
          >
            <option value="">{t.serviceInterestPlaceholder}</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {options.service[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('projectType')}
          label={t.projectType}
          required
          error={errors.projectType}
          errorId={errorId('projectType')}
          errorPrefix={t.fieldError}
        >
          <select
            id={fieldId('projectType')}
            name="projectType"
            value={values.projectType}
            onChange={(e) => update('projectType', e.target.value)}
            aria-invalid={errors.projectType ? true : undefined}
            aria-describedby={errors.projectType ? errorId('projectType') : undefined}
            className={inputClass(Boolean(errors.projectType))}
          >
            <option value="">{t.projectTypePlaceholder}</option>
            {projectTypeOptions.map((option) => (
              <option key={option} value={option}>
                {options.projectType[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('preferredDate')}
          label={t.preferredDate}
          optionalLabel={t.optional}
          hint={t.preferredDateHint}
          hintId={hintId('preferredDate')}
          error={errors.preferredDate}
          errorId={errorId('preferredDate')}
          errorPrefix={t.fieldError}
        >
          <input
            id={fieldId('preferredDate')}
            name="preferredDate"
            type="date"
            value={values.preferredDate}
            onChange={(e) => update('preferredDate', e.target.value)}
            aria-invalid={errors.preferredDate ? true : undefined}
            aria-describedby={
              errors.preferredDate ? errorId('preferredDate') : hintId('preferredDate')
            }
            className={inputClass(Boolean(errors.preferredDate))}
          />
        </Field>

        <Field
          id={fieldId('budget')}
          label={t.budget}
          optionalLabel={t.optional}
          error={errors.budget}
          errorId={errorId('budget')}
          errorPrefix={t.fieldError}
        >
          <select
            id={fieldId('budget')}
            name="budget"
            value={values.budget}
            onChange={(e) => update('budget', e.target.value)}
            className={inputClass(Boolean(errors.budget))}
          >
            <option value="">{t.budgetPlaceholder}</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {options.budget[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('referral')}
          label={t.referral}
          optionalLabel={t.optional}
          error={errors.referral}
          errorId={errorId('referral')}
          errorPrefix={t.fieldError}
          className="sm:col-span-2"
        >
          <select
            id={fieldId('referral')}
            name="referral"
            value={values.referral}
            onChange={(e) => update('referral', e.target.value)}
            className={inputClass(Boolean(errors.referral))}
          >
            <option value="">{t.referralPlaceholder}</option>
            {referralOptions.map((option) => (
              <option key={option} value={option}>
                {options.referral[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('details')}
          label={t.details}
          required
          hint={t.detailsHint}
          hintId={hintId('details')}
          error={errors.details}
          errorId={errorId('details')}
          errorPrefix={t.fieldError}
          className="sm:col-span-2"
        >
          <textarea
            id={fieldId('details')}
            name="details"
            rows={6}
            value={values.details}
            onChange={(e) => update('details', e.target.value)}
            aria-invalid={errors.details ? true : undefined}
            aria-describedby={errors.details ? errorId('details') : hintId('details')}
            className={cn(inputClass(Boolean(errors.details)), 'resize-y')}
          />
        </Field>
      </div>

      {/* Honeypot — hidden from people, visible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto size-px overflow-hidden">
        <label htmlFor={fieldId('website')}>{t.honeypotLabel}</label>
        <input
          id={fieldId('website')}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => update('website', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId('consent')} className="flex cursor-pointer items-start gap-3">
          <input
            id={fieldId('consent')}
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => update('consent', e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? errorId('consent') : undefined}
            className={cn(
              'mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-xs border bg-transparent',
              'checked:border-lime checked:bg-lime',
              'checked:bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23070A0D\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'20 6 9 17 4 12\'/%3E%3C/svg%3E")] checked:bg-[length:14px_14px] checked:bg-center checked:bg-no-repeat',
              errors.consent ? 'border-red-400' : 'border-line-strong',
            )}
          />
          <span className="text-sm text-mute">
            {t.consent}{' '}
            <Link
              href={pathFor(locale, 'privacy')}
              className="wipe-link text-lime transition-colors hover:text-bone"
            >
              {t.consentLink}
            </Link>
          </span>
        </label>
        {errors.consent ? (
          <p id={errorId('consent')} className="text-sm text-red-300">
            <span className="sr-only">{t.fieldError} </span>
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="tap inline-flex items-center justify-center gap-2 rounded-xs border border-lime bg-lime px-7 py-4 font-semibold text-ink transition-colors duration-300 hover:border-bone hover:bg-bone disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          <span className="display leading-none tracking-[0.02em]">
            {submitting ? t.submitting : t.submit}
          </span>
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-xs border bg-surface/60 px-4 py-3 text-base text-bone transition-colors',
    'placeholder:text-mute/60 focus:border-lime focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime',
    // 16px minimum keeps iOS Safari from zooming the viewport on focus.
    'min-h-[44px] text-[16px]',
    hasError ? 'border-red-400/70' : 'border-line',
  );
}

function Field({
  id,
  label,
  required,
  optionalLabel,
  hint,
  hintId,
  error,
  errorId,
  errorPrefix,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId: string;
  errorPrefix: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3">
        <span className="meta text-bone/90">
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-lime">
              *
            </span>
          ) : null}
        </span>
        {optionalLabel && !required ? (
          <span className="meta text-mute/60">{optionalLabel}</span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-mute/70">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-red-300">
          <span className="sr-only">{errorPrefix} </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
