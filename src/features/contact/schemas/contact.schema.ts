import type { ProcedureOption } from '@/features/procedures/services/procedures.service';
import type { ContactCountry, ContactErrors, ContactValues } from '@/features/contact/types/contact.types';
import { normalizeContactPhone } from '@/features/contact/utils/contact-phone.utils';

export function validateContact(values: ContactValues, accepted: boolean, countries: ContactCountry[], procedures: ProcedureOption[], dialCountry = '', dialCountries: ContactCountry[] = countries): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim() || [...values.name.trim()].length > 200) errors.name = 'requiredName';
  if (!countries.some((item) => item.code === values.country)) errors.country = 'requiredCountry';
  if (!procedures.some((item) => item.code === values.procedure)) errors.procedure = 'requiredProcedure';
  if (values.preferred_contact === 'email') {
    if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'invalidEmail';
  } else {
    const selected = dialCountries.find((item) => item.code === dialCountry);
    if (!selected?.dialRegion) errors.dial_country = 'dialUnavailable';
    else if (!normalizeContactPhone(values.phone, selected.dialRegion)) errors.phone = 'invalidPhone';
  }
  if (!['email', 'phone_call', 'whatsapp', 'telegram'].includes(values.preferred_contact)) errors.preferred_contact = 'requiredPreference';
  if ([...values.message.trim()].length > 5000) errors.message = 'longMessage';
  if (!accepted) errors.consent_accepted = 'requiredConsent';
  return errors;
}
