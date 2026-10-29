import type { ProcedureOption } from '@/features/procedures/services/procedures.service';
import type { ContactCountry, ContactErrors, ContactValues } from '@/features/contact/types/contact.types';

export function validateContact(values: ContactValues, accepted: boolean, countries: ContactCountry[], procedures: ProcedureOption[]): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim() || [...values.name.trim()].length > 200) errors.name = 'requiredName';
  const country = countries.find((item) => item.code === values.country);
  if (!country) errors.country = 'requiredCountry';
  if (!country?.cities.some((item) => item.code === values.city)) errors.city = 'requiredCity';
  if (!procedures.some((item) => item.code === values.procedure)) errors.procedure = 'requiredProcedure';
  if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'invalidEmail';
  if (values.phone.length > 64 || !/^\+[1-9]\d{7,14}$/.test(values.phone.replace(/[\s().-]/g, ''))) errors.phone = 'invalidPhone';
  if (!['email', 'whatsapp', 'telegram'].includes(values.preferred_contact)) errors.preferred_contact = 'requiredPreference';
  if ([...values.message.trim()].length > 5000) errors.message = 'longMessage';
  if (!accepted) errors.consent_accepted = 'requiredConsent';
  return errors;
}
