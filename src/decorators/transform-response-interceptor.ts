import { applyDecorators, CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export class CircularReferenceInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                return JSON.parse(JSON.stringify(data, (key, value) => {
                    if ((key === 'cart' || key === 'items') && typeof value === 'object') {
                        return undefined;
                    }
                    return value;
                }));
            })
        );
    }
}

export function RemoveCircularReferences() {
    return applyDecorators(UseInterceptors(CircularReferenceInterceptor));
}
