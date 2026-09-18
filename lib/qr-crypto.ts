import crypto from "crypto";

export interface QrTokenPayload {
  sid: string; // classSessionId
  seq: number; // sequence number
  iat: number; // issued at (timestamp in seconds)
  exp: number; // expires at (timestamp in seconds)
  nonce: string; // unique random nonce
  sig: string; // HMAC-SHA256 signature
}

/**
 * Builds a signed QR token with strict expiration and random nonce.
 * Rotates every 10-15 seconds.
 */
export function generateQrPayload(
  classSessionId: string,
  sessionSecret: string,
  seq: number = 1,
  ttlSeconds: number = 15
): { rawString: string; payload: QrTokenPayload } {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + ttlSeconds;
  const nonce = crypto.randomBytes(8).toString("hex");

  const message = `${classSessionId}:${seq}:${nowSec}:${expSec}:${nonce}`;
  const sig = crypto
    .createHmac("sha256", sessionSecret)
    .update(message)
    .digest("hex");

  const payload: QrTokenPayload = {
    sid: classSessionId,
    seq,
    iat: nowSec,
    exp: expSec,
    nonce,
    sig,
  };

  return {
    rawString: JSON.stringify(payload),
    payload,
  };
}

/**
 * Validates the HMAC-SHA256 signature, expiration bounds, and structure of a QR payload.
 */
export function verifyQrPayload(
  rawPayloadString: string,
  sessionSecret: string,
  driftLeewaySeconds: number = 5
): {
  isValid: boolean;
  error?: string;
  payload?: QrTokenPayload;
} {
  let payload: QrTokenPayload;
  try {
    payload = JSON.parse(rawPayloadString);
  } catch {
    return { isValid: false, error: "Invalid QR code format." };
  }

  const { sid, seq, iat, exp, nonce, sig } = payload;
  if (!sid || typeof seq !== "number" || !iat || !exp || !nonce || !sig) {
    return { isValid: false, error: "Malformed QR code payload attributes." };
  }

  // 1. Verify Signature Integrity
  const message = `${sid}:${seq}:${iat}:${exp}:${nonce}`;
  const expectedSig = crypto
    .createHmac("sha256", sessionSecret)
    .update(message)
    .digest("hex");

  const sigBuffer = Buffer.from(sig, "hex");
  const expectedBuffer = Buffer.from(expectedSig, "hex");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { isValid: false, error: "Cryptographic signature validation failed. QR code has been tampered with." };
  }

  // 2. Check Expiration with Clock Drift Tolerance
  const nowSec = Math.floor(Date.now() / 1000);

  if (nowSec > exp + driftLeewaySeconds) {
    return {
      isValid: false,
      error: "QR code has expired. Please scan the newly refreshed QR code.",
    };
  }

  if (nowSec < iat - driftLeewaySeconds) {
    return {
      isValid: false,
      error: "QR code timestamp is in the future. Check device clock synchronization.",
    };
  }

  return {
    isValid: true,
    payload,
  };
}
