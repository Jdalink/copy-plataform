// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Asegúrate de que la clave de encriptación sea de 32 bytes (256 bits) para aes-256-cbc.
// El MEDIA_ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres.
const ENCRYPTION_KEY = Buffer.from(process.env.MEDIA_ENCRYPTION_KEY || '', 'hex');
const IV_LENGTH = 16; // Para AES, el IV es siempre de 16 bytes

export function encrypt(buffer: Buffer): Buffer {
    if (!process.env.MEDIA_ENCRYPTION_KEY || Buffer.byteLength(ENCRYPTION_KEY) !== 32) {
        throw new Error("MEDIA_ENCRYPTION_KEY no está definida o no tiene la longitud correcta (debe ser una cadena hexadecimal de 64 caracteres).");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
}

export function decrypt(buffer: Buffer): Buffer {
    if (!process.env.MEDIA_ENCRYPTION_KEY || Buffer.byteLength(ENCRYPTION_KEY) !== 32) {
         throw new Error("MEDIA_ENCRYPTION_KEY no está definida o tiene una longitud incorrecta.");
    }
    const iv = buffer.slice(0, IV_LENGTH);
    const encryptedText = buffer.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted;
}
