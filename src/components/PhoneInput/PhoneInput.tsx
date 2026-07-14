import { useState } from 'react';
import type { FormEvent } from 'react';
import { isValidBrazilianPhone, maskBrazilianPhoneInput } from '../../utils/phone';

interface PhoneInputProps {
  initialValue?: string;
  onSubmit: (phone: string) => void;
}

export function PhoneInput({ initialValue = '', onSubmit }: PhoneInputProps) {
  const [phone, setPhone] = useState(maskBrazilianPhoneInput(initialValue));
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidBrazilianPhone(phone)) {
      setError('Informe um WhatsApp valido com DDD.');
      return;
    }

    setError('');
    onSubmit(phone);
  }

  return (
    <form className="phone-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="phone">WhatsApp</label>
      <input
        id="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(51) 99999-9999"
        value={phone}
        onChange={(event) => {
          setPhone(maskBrazilianPhoneInput(event.target.value));
          setError('');
        }}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="primary-action">Continuar</button>
    </form>
  );
}
