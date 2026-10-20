import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request as RequestExpress } from 'express';
export type RequestType = RequestExpress & {
  user: {
    name: string;
    email: string;
    sub: string;
    username: string;
    createdAt: Date;
  };
};
export const Request = createParamDecorator<RequestType>(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request;
  },
);
