interface IOauthDomainPayload {
  error: string;
  message: string;
}

type StatusCode = 404 | 401 | 403 | 400 | 500;
export enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export class MFAError extends Error {
  readonly status: StatusCode;
  readonly error: string;
  constructor(errorPayload: IOauthDomainPayload, status: StatusCode) {
    super(errorPayload.message);
    this.name = 'MFAError';
    this.error = errorPayload.error;
    this.status = status;
  }
  static invalidTOTP(description?: string): MFAError {
    return new MFAError(
      {
        error: 'invalid_totp',
        message:
          description ||
          'The provided TOTP is invalid, expired, revoked, does not match the expected value, or was issued to another client.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  static invalidTOTPSecret(description?: string): MFAError {
    return new MFAError(
      {
        error: 'invalid_secret',
        message:
          description ||
          'The provided secret is invalid, expired, revoked, does not match the expected value, or was issued to another client.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  static failedToSaveMFA(description?: string): MFAError {
    return new MFAError(
      {
        error: 'failed_to_save_mfa',
        message:
          description || 'Failed to save the MFA entity to the database.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  static failedToUpdateMFA(description?: string): MFAError {
    return new MFAError(
      {
        error: 'failed_to_update_mfa',
        message:
          description || 'Failed to update the MFA entity in the database.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  static notFoundMFA(description?: string): MFAError {
    return new MFAError(
      {
        error: 'not_found_mfa',
        message: description || 'The requested MFA entity was not found.',
      },
      HttpStatus.NOT_FOUND,
    );
  }
  static alreadyRegisteredMFA(description?: string): MFAError {
    return new MFAError(
      {
        error: 'already_registered_mfa',
        message:
          description ||
          'The user already has a registered MFA method of this type.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  static internalServerError(description?: string): MFAError {
    return new MFAError(
      {
        error: 'internal_server_error',
        message: description || 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
