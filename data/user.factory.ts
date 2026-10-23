import { randomUUID } from 'node:crypto';

export interface Address {
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  country: string;      // label shown in the country <select>
  countryCode: string;  // ISO code the API expects
  postalCode: string;
}

export interface User {
  firstName: string;
  lastName: string;
  dob: string;          // YYYY-MM-DD, the format the register form asks for
  phone: string;
  email: string;
  password: string;
  address: Address;
}

/**
 * Returns a brand-new customer every call. The email is unique per call, so the
 * suite can run again and again (and in parallel) without "email already exists".
 */
export function createUser(overrides: Partial<User> = {}): User {
  const id = `${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;
  // Letters only: some builds reject digits in names. Still unique enough to spot in a report.
  const suffix = id.slice(-4).replace(/\d/g, d => 'abcdefghij'[Number(d)]);
  return {
    firstName: 'Aru',
    lastName: `Tester${suffix}`,
    dob: '1998-04-15',
    phone: '77011234567',
    email: `sis2.${id}@example.com`,
    // Meets the form rules: 8+ chars, upper and lower case, a digit and a symbol.
    password: `Sis2#${id}Aa1`,
    address: {
      street: 'Abay Avenue',
      houseNumber: '10',
      city: 'Almaty',
      state: 'Almaty Region',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      postalCode: '050000',
    },
    ...overrides,
  };
}

export function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
