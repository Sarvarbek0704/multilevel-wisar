import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  sub: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    return data ? user?.[data] : user;
  },
);
