/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function load(relativePath, mocks = {}, globals = {}) {
  const filename = path.join(root, relativePath);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, URL, Date, window: undefined, process: { env: {} },
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    ...globals,
  }, { filename });
  return exports;
}

const redirect = load('utils/oauth-redirect.ts');
function authHarness(browserResult, { platform = 'android', webOrigin, env = {} } = {}) {
  const requests = [];
  const sessions = [];
  const browserCalls = [];
  const auth = load('services/auth-api.ts', {
    'expo-web-browser': {
      openAuthSessionAsync: async (...args) => {
        browserCalls.push(args);
        return typeof browserResult === 'function' ? browserResult() : browserResult;
      },
    },
    'react-native': { Platform: { OS: platform } },
    'expo-crypto': {
      getRandomBytes: (size) => crypto.randomBytes(size),
      CryptoDigestAlgorithm: { SHA256: 'sha256' },
      CryptoEncoding: { BASE64: 'base64' },
      digestStringAsync: async (algorithm, value) => crypto.createHash(algorithm).update(value).digest('base64'),
    },
    '@/utils/oauth-redirect': redirect,
    '@/services/api-client': {
      initializeApiBaseUrl: async () => {},
      getApiBaseUrl: () => 'https://api.estings.shop/api/v1',
      apiFetch: async (url, options) => {
        requests.push({ url, options });
        if (url.startsWith('/auth/oauth/exchange')) return { access_token: 'access', refresh_token: 'refresh', token_type: 'bearer' };
        if (url === '/auth/me') return { id: 'customer', email: 'customer@example.com', role: 'customer' };
        return { message: 'success' };
      },
    },
    '@/services/auth-session': {
      saveAuthSession: async (session) => sessions.push(session),
      clearAuthSession: async () => {},
    },
  }, { window: webOrigin ? { location: { origin: webOrigin } } : undefined, process: { env } });
  return { auth, requests, sessions, browserCalls };
}

test('OAuth rejects foreign origins, wrong callback paths, and missing codes', () => {
  for (const url of [
    'https://estings.shop.attacker.test/oauth/callback?code=secret',
    'https://estings.shop/other?code=secret',
    'https://estings.shop/oauth/callback',
  ]) assert.throws(() => redirect.parseOAuthReturn(url, redirect.OAUTH_WEB_BASE_URL));
  assert.throws(() => redirect.parseOAuthReturn('https://estings.shop/login?error=facebook_email_required', redirect.OAUTH_WEB_BASE_URL), /share your email/);
});

for (const provider of ['google', 'facebook']) {
  test(`${provider} returns directly to native and exchanges the code with its proof key`, async () => {
    const h = authHarness(() => {
      const request = new URL(h.browserCalls[0][0]);
      return { type: 'success', url: `bloomoramobile://oauth/callback?code=signed%2Bcode&state=${request.searchParams.get('app_state')}` };
    });
    await h.auth.loginWithOAuthProvider(provider);
    const request = new URL(h.browserCalls[0][0]);
    assert.equal(request.pathname, `/api/v1/auth/${provider}`);
    assert.equal(request.searchParams.get('client'), 'mobile');
    assert.equal(request.searchParams.has('frontend_url'), false);
    assert.equal(h.browserCalls[0][1], 'bloomoramobile://oauth/callback');
    assert.equal(h.requests[0].url, '/auth/oauth/exchange');
    const payload = JSON.parse(h.requests[0].options.body);
    assert.equal(h.requests[0].options.method, 'POST');
    assert.equal(payload.code, 'signed+code');
    assert.equal(crypto.createHash('sha256').update(payload.code_verifier).digest('base64url'), request.searchParams.get('code_challenge'));
    assert.equal(h.requests[1].options.token, 'access');
    assert.equal(h.sessions[0].refreshToken, 'refresh');
  });
}

test('Router and browser deliveries of one callback exchange only once, including late deliveries', async () => {
  let releaseBrowser;
  let markBrowserStarted;
  const browserStarted = new Promise((resolve) => { markBrowserStarted = resolve; });
  const browser = new Promise((resolve) => { releaseBrowser = resolve; });
  const h = authHarness(() => { markBrowserStarted(); return browser; });
  const login = h.auth.loginWithOAuthProvider('google');
  await browserStarted;
  const state = new URL(h.browserCalls[0][0]).searchParams.get('app_state');
  const callback = `bloomoramobile://oauth/callback?code=signed&state=${state}`;
  const first = h.auth.completeOAuthSignInFromUrl(callback);
  assert.equal(h.auth.completeOAuthSignInFromUrl(callback), first);
  await first;
  releaseBrowser({ type: 'dismiss' });
  await login;
  await h.auth.completeOAuthSignInFromUrl(callback);
  assert.equal(h.requests.length, 2);
  assert.equal(h.sessions.length, 1);
  await assert.rejects(async () => h.auth.completeOAuthSignInFromUrl(callback.replace('signed', 'different')), /different sign-in/);
});

test('Unsolicited or cancelled callbacks cannot create a session', async () => {
  const h = authHarness({ type: 'cancel' });
  await assert.rejects(h.auth.completeOAuthSignInFromUrl('https://estings.shop/oauth/callback?code=signed'), /expired/);
  await assert.rejects(h.auth.loginWithOAuthProvider('facebook'), /cancelled/);
  assert.equal(h.requests.length, 0);
  assert.equal(h.sessions.length, 0);
});

test('Password reset uses the real backend endpoints and exact request fields', async () => {
  const h = authHarness();
  await h.auth.sendForgotPasswordOtp(' customer@example.com ');
  await h.auth.resetForgotPassword({ email: ' customer@example.com ', otp: ' 123456 ', newPassword: 'NewPassword!' });
  assert.equal(h.requests[0].url, '/auth/forgot-password/send-otp');
  assert.deepEqual(JSON.parse(h.requests[0].options.body), { email: 'customer@example.com' });
  assert.equal(h.requests[1].url, '/auth/forgot-password/reset');
  assert.deepEqual(JSON.parse(h.requests[1].options.body), { email: 'customer@example.com', otp: '123456', new_password: 'NewPassword!' });
  assert.equal(h.requests[1].options.skipAuthRefresh, true);
});

test('Native configuration uses the app scheme without website association', () => {
  const config = require('../app.config.js')();
  assert.equal(config.scheme, 'bloomoramobile');
  assert.equal(config.android.intentFilters, undefined);
  assert.equal(config.ios.associatedDomains, undefined);
});

test('Native callback rejects the wrong app, path, state, or website', () => {
  const expected = redirect.OAUTH_NATIVE_CALLBACK_URL;
  for (const url of [
    'otherapp://oauth/callback?code=signed&state=expected',
    'bloomoramobile://other/callback?code=signed&state=expected',
    'bloomoramobile://oauth/other?code=signed&state=expected',
    'bloomoramobile://oauth/callback?code=signed&state=wrong',
    'bloomoramobile://oauth/callback?code=signed',
    'https://estings.shop/oauth/callback?code=signed&state=expected',
  ]) assert.throws(() => redirect.parseOAuthReturn(url, expected, 'expected'));
});

test('EAS release profiles do not override the callback with the retired website', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'eas.json'), 'utf8'));
  for (const name of ['preview', 'apk', 'production']) {
    assert.equal(config.build[name].env.EXPO_PUBLIC_WEB_URL, redirect.OAUTH_WEB_BASE_URL, name);
  }
});

test('Browser preview returns to its own origin even with a production website override', async () => {
  const h = authHarness({ type: 'success', url: 'http://localhost:5179/oauth/callback?code=signed' }, {
    platform: 'web',
    webOrigin: 'http://localhost:5179',
    env: { EXPO_PUBLIC_WEB_URL: 'https://estings.shop' },
  });
  await h.auth.loginWithOAuthProvider('google');
  assert.equal(h.browserCalls[0][1], 'http://localhost:5179/oauth/callback');
  assert.ok(h.browserCalls[0][0].endsWith('frontend_url=http%3A%2F%2Flocalhost%3A5179'));
  assert.equal(h.sessions.length, 1);
});

test('Web preview starts on an origin the backend allows', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(config.scripts.web, /--port 5179/);
  assert.match(config.scripts.web, /--localhost/);
});

test('A provider failure returns to the browser opener without creating a session', async () => {
  const h = authHarness({ type: 'success', url: 'http://localhost:5179/login?error=facebook_email_required' }, {
    platform: 'web', webOrigin: 'http://localhost:5179',
  });
  await assert.rejects(h.auth.loginWithOAuthProvider('facebook'), /share your email/);
  assert.equal(h.requests.length, 0);
  assert.equal(h.sessions.length, 0);
});
