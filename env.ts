// Target application. Override with BASE_URL / API_URL to run against another build,
// e.g. `npm run test:bugs` points the suite at the deliberately buggy version.
export const BASE_URL = process.env.BASE_URL ?? 'https://practicesoftwaretesting.com';
export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';
// The buggy build is an older version of the app: hash routing (/#/auth/login), an older
// register form and API payload, and no product comparison feature.
export const IS_BUGGY_BUILD = BASE_URL.includes('with-bugs');
export const ROUTE_PREFIX = IS_BUGGY_BUILD ? '/#' : '';

export const AUTH_FILE = 'playwright/.auth/buyer.json';
