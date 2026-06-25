// Utilities to help with WebAuthn base64url conversions and mock backend logic
// Since we have no backend, we just generate challenges locally.

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function registerBiometrics(userName) {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported on this device/browser.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const publicKey = {
    challenge: challenge.buffer,
    rp: {
      name: "Eco-Expense App",
    },
    user: {
      id: userId.buffer,
      name: userName || "user@example.com",
      displayName: userName || "User",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },  // ES256
      { type: "public-key", alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Forces use of device built-in authenticator (Face ID/Touch ID)
      userVerification: "required"
    },
    timeout: 60000,
  };

  const credential = await navigator.credentials.create({ publicKey });
  
  // Store the rawId to use during authentication
  const credentialIdBase64 = bufferToBase64url(credential.rawId);
  return credentialIdBase64;
}

export async function authenticateBiometrics(credentialIdBase64) {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported on this device/browser.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credentialIdBuffer = base64urlToBuffer(credentialIdBase64);

  const publicKey = {
    challenge: challenge.buffer,
    allowCredentials: [
      {
        id: credentialIdBuffer,
        type: "public-key",
      }
    ],
    userVerification: "required",
    timeout: 60000,
  };

  // If this succeeds, it means Face ID / Touch ID passed
  await navigator.credentials.get({ publicKey });
  return true;
}
