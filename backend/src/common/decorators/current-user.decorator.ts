import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser('id') userId: string
 *  → req.user.id 추출 (JwtAuthGuard 통과 후 set 됨)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
  },
);
