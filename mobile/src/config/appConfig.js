import Constants from 'expo-constants';

const readExpoHostUri = () => (
  Constants.expoConfig?.hostUri
  || Constants.manifest2?.extra?.expoClient?.hostUri
  || Constants.manifest?.debuggerHost
  || Constants.expoGoConfig?.debuggerHost
  || ''
);

const extractHost = (value = '') => {
  const clean = value.toString().trim();
  if (!clean) return '';
  const withoutProtocol = clean.replace(/^https?:\/\//i, '');
  const [host] = withoutProtocol.split(':');
  return host || '';
};

const detectedDevHost = extractHost(readExpoHostUri());

const resolveBaseUrl = (explicitValue, port, suffix = '') => {
  if (explicitValue?.trim()) return explicitValue.trim();
  if (detectedDevHost) return `http://${detectedDevHost}:${port}${suffix}`;
  return `http://localhost:${port}${suffix}`;
};

const apiUrl = resolveBaseUrl(process.env.EXPO_PUBLIC_API_URL, 5000);
const portalUrl = resolveBaseUrl(process.env.EXPO_PUBLIC_PORTAL_URL, 3002, '/sdashboard');
const websiteUrl = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim();
const invalidWebsiteUrl = !websiteUrl || ['undefined', 'null'].includes(websiteUrl.toLowerCase());
const loginUrl = invalidWebsiteUrl ? 'https://tradeethiopian.com/login' : websiteUrl;

export const appConfig = {
  apiUrl,
  portalUrl,
  loginUrl,
  detectedDevHost,
  isUsingFallbackHost: !process.env.EXPO_PUBLIC_API_URL && Boolean(detectedDevHost),
  isUsingLocalhostFallback: !process.env.EXPO_PUBLIC_API_URL && !detectedDevHost
};
