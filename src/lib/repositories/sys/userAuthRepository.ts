import bcrypt from 'bcryptjs';
import { RepositoryBase } from '../../helpers/repository-base';
import { executeQuery, QueryBuilder } from '../../helpers/db-helper';
import { UserData } from '../../actions/sys/auth';
import { User } from './userRepository';
import sendSms from '../../utils/sms';

type LoginResponse = {
  success: boolean;
  user?: UserData;
  message: string;
};

export class UserAuthRepository extends RepositoryBase {
  private builder: QueryBuilder;

  constructor() {
    super()
    this.builder = new QueryBuilder('users');
  }

  private async validatePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return password == hashedPassword;
    // return bcrypt.compare(password, hashedPassword);
  }

  private async logAttempt(
    userId: number | null,
    identifier: string,
    password: string,
    success: boolean,
    ipAddress: string
  ): Promise<number> {
    const attemptBuilder = new QueryBuilder('login_attempts');

    const logId = await attemptBuilder.insert({
      user_id: userId,
      identifier_used: identifier,
      password_used: 'N/A',
      success,
      ip_address: ipAddress
    });

    return logId;
  }

  async login(
    identifier: string,
    password: string,
    ipAddress: string,
    type: number = 1
  ): Promise<LoginResponse> {
    try {
      const recentAttempts = await executeQuery<any[]>(`
        SELECT COUNT(*) as count 
        FROM login_attempts 
        WHERE ip_address = ? 
        AND success = false 
        AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
      `, [ipAddress]);

      if (recentAttempts[0].count >= 5) {
        return {
          success: false,
          message: "Too many failed attempts. Please try again later."
        };
      }


      const users = await executeQuery<any[]>(`
        SELECT iu.*, 
        cm.company_id, cm.company_name, cm.abbr
        FROM users iu
        LEFT JOIN company_master cm
          ON cm.company_id = iu.company_id
          AND cm.is_active = 1
        WHERE (iu.id = ? 
          OR iu.email = ? 
          OR iu.phone = ?)
          AND iu.status = 1
        LIMIT 1
      `, [identifier, identifier, identifier]);

      if (users.length === 0) {
        await this.logAttempt(null, identifier, password, false, ipAddress);
        return {
          success: false,
          message: "Invalid credentials"
        };
      }

      const user = users[0];

      const isValidPassword = await this.validatePassword(
        password,
        user.password
      );

      if (!isValidPassword) {
        await this.logAttempt(user.id, identifier, password, false, ipAddress);
        return {
          success: false,
          message: "Invalid credentials"
        };
      }

      await this.builder
        .where('id = ?', user.id)
        .update({ last_login: new Date() });

      await this.logAttempt(user.id, identifier, password, true, ipAddress);


      const userObj = {
        user_id: user.id,
        user_phone: user.phone,
        user_email: user.email,
        user_avatar: user.image,
        user_name: user.name,
        company_name: user.company_name,
        company_id: user.company_id,
        company_abbr: user.abbr,
        role: user.role,
      }

      return {
        success: true,
        user: userObj,
        message: ''
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async initializeOtpLogin(
    phone: string,
    ipAddress: string
  ) {
    try {
      const user = await new QueryBuilder('users')
        .where('phone = ?', phone)
        .where('status = 1')
        .select();


      if (user.length === 0) {
        return this.failure('User not found');
      }

      const userData = user[0] as User;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const otpData = {
        user_id: userData.id,
        phone: phone,
        otp: otp,
        status: 0,
      };

      await new QueryBuilder('login_otp')
        .where('user_id = ?', userData.id)
        .where('status = 0')
        .update({ status: -1 });

      await new QueryBuilder('login_otp')
        .insert(otpData);

      await sendSms(phone, otp, 'OTPLogin');

      return this.success('Otp Sent')

    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyOtpLogin(
    phone: string,
    otp: string,
    token: string,
    ipAddress: string
  ) {
    try {
      const user = await new QueryBuilder('users')
        .where('phone = ?', phone)
        .where('status = 1')
        .select();


      if (user.length === 0) {
        return this.failure('User not found');
      }

      const userData = user[0] as User;

      const otpLog = await new QueryBuilder('login_otp')
        .where('user_id = ?', userData.id)
        .where('status = 0')
        .limit(1)
        .orderBy('created_on', 'DESC')
        .select();

      if (otpLog.length === 0) {
        return this.failure('No valid OTP found for this user');
      }
      const otpData: any = otpLog[0];

      if (otpData.otp != otp) {
        await this.logAttempt(userData.id, phone, otp, false, ipAddress);
        return this.failure('Invalid OTP');
      }

      await new QueryBuilder('users')
        .where('id = ?', userData.id)
        .update({ last_login: new Date(), token });

      await new QueryBuilder('login_otp')
        .where('id = ?', otpData.id)
        .update({ status: 1 });

      await this.logAttempt(userData.id, phone, otp, true, ipAddress);

      const userObj = {
        user_id: userData.id,
        user_phone: userData.phone,
        user_email: userData.email,
        user_avatar: userData.avatar,
        user_name: userData.name,
        company_id: userData.company_id,
        role: userData.role,
      }

      return this.success(userObj)
    } catch (error) {
      return this.handleError(error);
    }
  }
}
