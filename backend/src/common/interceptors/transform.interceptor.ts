import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/** 모든 응답을 { data, meta? } 포맷으로 통일 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<{ data: T }> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
