// Derives a device identifier from stable browser/hardware signals instead
// of asking the user to type one in — device_id is one of TARA's three
// shared-attribute signals (device, address, employer), so it needs to
// reflect the actual device submitting the form, not an arbitrary string.
//
// This hashes readily-available navigator/screen properties with the
// browser's native SubtleCrypto API — no third-party fingerprinting
// dependency. It's deterministic (same device/browser -> same ID each
// time, no storage needed) but lower-entropy than a dedicated fingerprinting
// SDK, and is resettable by switching browsers or private/incognito mode.
// That trade-off is fine for a pilot; a production deployment would swap
// this for a proper device-attestation SDK behind the same call site.
export async function getDeviceId() {
  const signals = [
    navigator.userAgent,
    navigator.language,
    String(navigator.hardwareConcurrency ?? ''),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
  ].join('|')

  const bytes = new TextEncoder().encode(signals)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

  // Formatted to match the seed dataset's DEV-XXXXX convention.
  return `DEV-${hex.slice(0, 5).toUpperCase()}`
}
