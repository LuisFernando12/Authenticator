import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request as RequestExpress } from 'express';
export type RequestType = RequestExpress & {
  user: {
    sub: string;
    username: string;
    scope?: string;
    aud?: string;
    iss?: string;
    type?: 'access' | 'email_verification';
  };
};
export const Request = createParamDecorator<RequestType>(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request;
  },
);
