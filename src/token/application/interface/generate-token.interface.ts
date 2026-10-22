export interface IGenerateToken {
  sub: string;
  username: string;
  scope?: string;
  aud?: string;
  iss?: string;
  type?: 'access' | 'email_verification' | 'mfa';
}
