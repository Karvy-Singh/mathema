import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
/** JwtAuthGuard 전역 적용 시, 이 데코레이터로 표시된 라우트는 인증 우회 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
