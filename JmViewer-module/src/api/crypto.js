import CryptoJS from "../crypto/crypto.js";

export function calculateMD5(inputStr) {
    return CryptoJS.MD5(inputStr).toString();
}

export function generateToken(key) {
    return {
        token: calculateMD5(key + "185Hcomic3PAPP7R"),
        tokenParam: `${key},3.2.0`
    };
}

const predefinedKeyTemplates = ["185Hcomic3PAPP7R", "18comicAPPContent"];

export function decryptData(key, cipherText) {
    for (const template of predefinedKeyTemplates) {
        try {
            const dynamicKey = calculateMD5(key + template);
            const decryptedData = CryptoJS.AES.decrypt(
                cipherText,
                CryptoJS.enc.Utf8.parse(dynamicKey),
                { mode: CryptoJS.mode.ECB }
            );
            return JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            continue;
        }
    }
    throw new Error("Decryption failed");
}