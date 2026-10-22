export const GENERATE_ID_SERVICE_PORT = Symbol('GENERATE_ID_SERVICE_PORT');
export abstract class GenerateIdServicePort {
  abstract generateOauthRequestId(): string;
  abstract generateOauthAuthorizationCode(): string;
  abstract generateMFAChallengeId(): string;
}
