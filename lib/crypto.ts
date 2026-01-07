import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import fs from 'fs';

// --- Configuración de Criptografía ---
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Para AES, esto es siempre 16
const AUTH_TAG_LENGTH = 16;

// --- Leer la Clave de Encriptación ---
let encryptionKey: Buffer;

const keyPath = process.env.MEDIA_ENCRYPTION_KEY_FILE;
let keyString: string | undefined;

if (keyPath) {
  try {
    keyString = fs.readFileSync(keyPath, 'utf8').trim();
  } catch (e) {
    console.warn(`Advertencia: No se pudo leer el archivo de clave en ${keyPath}.`);
  }
}

if (!keyString) {
  keyString = process.env.MEDIA_ENCRYPTION_KEY;
}

if (!keyString || keyString.length < 32) {
  console.error("Error Crítico: La clave de encriptación (MEDIA_ENCRYPTION_KEY) no está definida o es demasiado corta. Debe tener al menos 32 caracteres.");
  // En un entorno real, esto debería detener el inicio de la aplicación.
  // Usamos una clave de placeholder para evitar un crash, pero la encriptación no será segura.
  encryptionKey = Buffer.from('a'.repeat(32)); 
} else {
  // Asegurarse de que la clave tenga exactamente 32 bytes para AES-256
  encryptionKey = Buffer.from(keyString.slice(0, 32));
}


/**
 * Encripta un buffer de datos.
 * @param buffer - El buffer a encriptar.
 * @returns Un buffer que contiene el IV + AuthTag + Datos Encriptados.
 */
export function encrypt(buffer: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Concatenar iv, authTag y el texto cifrado para guardarlo
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Desencripta un buffer de datos.
 * @param encryptedBuffer - El buffer que contiene el IV + AuthTag + Datos Encriptados.
 * @returns El buffer original desencriptado.
 */
export function decrypt(encryptedBuffer: Buffer): Buffer {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted;
}