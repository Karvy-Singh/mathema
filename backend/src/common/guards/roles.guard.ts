import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/** 추후 admin/teacher 분리 시 사용 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext): boolean { return true; }
}
