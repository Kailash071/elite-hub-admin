import crypto from "crypto"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
const SALT_LENGTH = 16 // Salt length in bytes
const ITERATIONS = 100000
const KEY_LENGTH = 64
const ALGORITHM = "sha512"

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

/**
 * @param {string} password
 * @returns {string} Hashed password
 */
export const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
  // const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  // const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM).toString('hex');
  // return `${salt}:${hash}`;
}

/**
 * @param {string} password - Plaintext password
 * @param {string} storedHash - password hash
 * @returns {boolean} True if passwords match, otherwise false
 */
export const comparePassword = async (password: string, storedHash: string) => {
  return await bcrypt.compare(password, storedHash)
  // const [salt, hash] = storedHash.split(':');
  // const newHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM).toString('hex');
  // return newHash === hash;
}
// Util: AES Encryption
export const encrypt = (input: string, key: string) => {
  const cipher = crypto.createCipheriv(
    "aes-256-ecb",
    Buffer.from(key, "utf8"),
    null
  )
  let encrypted = cipher.update(input, "utf8", "base64")
  encrypted += cipher.final("base64")
  return encrypted
}
// Util: AES Decryption
export const decrypt = (input: string, key: string) => {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-ecb",
      Buffer.from(key, "utf8"),
      null
    )
    let decrypted = decipher.update(input, "base64", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (error) {
    console.error("Decryption Error:", error)
    return null
  }
}

export const generateJwtToken = (
  payload: object,
  secret?: string,
  expiresIn: string = JWT_EXPIRES_IN
) => {
  try {
    const key = secret || JWT_SECRET || ""
    if (!key) {
      throw new Error("JWT secret is not configured")
    }
    return jwt.sign(
      payload,
      key as jwt.Secret,
      { expiresIn } as jwt.SignOptions
    )
  } catch (error) {
    console.error("JWT Generation Error:", error)
    return null
  }
}

export const verifyJwtToken = (token: string, secret?: string) => {
  try {
    const key = secret || JWT_SECRET
    if (!key) {
      throw new Error("JWT secret is not configured")
    }
    let verify = jwt.verify(token, key as string)
    return verify
  } catch (error) {
    console.error("JWT Verification Error:", error)
    return null
  }
}
