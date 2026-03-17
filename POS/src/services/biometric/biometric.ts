/**
 * WebAuthn biometric helpers — platform authenticator only (Touch ID, Face ID, Windows Hello).
 * Works fully offline. No server-side signature verification — device handles biometric check.
 */

export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function registerBiometric(employeeId: number, name: string): Promise<string> {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'Store POS', id: location.hostname },
      user: {
        id: new Uint8Array([employeeId]),
        name,
        displayName: name,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    },
  }) as PublicKeyCredential | null

  if (!credential) throw new Error('Biometric registration cancelled')
  return bufferToBase64(credential.rawId)
}

export async function authenticateBiometric(credentialId: string): Promise<boolean> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: location.hostname,
        allowCredentials: [
          {
            type: 'public-key',
            id: base64ToBuffer(credentialId),
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null
    return credential !== null
  } catch {
    return false
  }
}
