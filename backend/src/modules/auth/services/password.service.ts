import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  private readonly keyLength = 64;

  // 使用带随机盐的 scrypt 哈希密码，避免明文和弱散列写入数据库。
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, this.keyLength).toString('hex');

    return `scrypt:${salt}:${derivedKey}`;
  }

  // 统一校验密码格式与内容，后续若切换 bcrypt/argon2 也只需改这里。
  verifyPassword(password: string, passwordHash: string): boolean {
    const [algorithm, salt, storedKey] = passwordHash.split(':');

    if (!algorithm || !salt || !storedKey || algorithm !== 'scrypt') {
      return false;
    }

    const derivedKey = scryptSync(password, salt, this.keyLength);
    const storedBuffer = Buffer.from(storedKey, 'hex');

    if (storedBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
  }
}