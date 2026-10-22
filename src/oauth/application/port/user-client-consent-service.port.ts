export const CONSENT_SERVICE_PORT = Symbol('CONSENT_SERVICE_PORT');
export abstract class ConsentServicePort {
  abstract findByConsentId(consentId: string);
  abstract findConsentByUserIdAndClientId(userId: string, clientId: string);
  abstract findOrCreateConsent(userId: string, clientId: string, scope: string);
}
