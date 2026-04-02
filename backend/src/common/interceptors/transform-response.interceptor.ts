import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiSuccessResponse } from '../types/api-response.type';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();

    // 在系统级基础层统一响应包裹，便于前后端后续稳定联调。
    return next.handle().pipe(
      map((data: T) => ({
        code: 'OK',
        message: 'success',
        data,
        requestId: request.id ?? `req_${Date.now()}`,
      })),
    );
  }
}
