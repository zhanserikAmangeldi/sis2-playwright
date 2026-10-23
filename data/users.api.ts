import { request, expect } from '@playwright/test';
import { API_URL, IS_BUGGY_BUILD } from '../env';
import { User } from './user.factory';

/**
 * Creates the account through the REST API. Used for test *preconditions* only:
 * the register test itself goes through the UI, every other test just needs
 * an account to exist, quickly and reliably.
 */
export async function registerViaApi(user: User): Promise<void> {
  const common = {
    city: user.address.city,
    state: user.address.state,
    country: user.address.countryCode,
  };
  const api = await request.newContext({ baseURL: API_URL });
  const response = await api.post('/users/register', {
    data: {
      first_name: user.firstName,
      last_name: user.lastName,
      dob: user.dob,
      phone: user.phone,
      email: user.email,
      password: user.password,
      // The buggy build runs an older API that takes the address as flat fields.
      ...(IS_BUGGY_BUILD
        ? {
            ...common,
            address: `${user.address.street} ${user.address.houseNumber}`,
            postcode: user.address.postalCode,
          }
        : {
            address: {
              ...common,
              street: user.address.street,
              house_number: user.address.houseNumber,
              postal_code: user.address.postalCode,
            },
          }),
    },
  });
  expect(response.status(), `register ${user.email}: ${await response.text()}`).toBe(201);
  await api.dispose();
}
