import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AbstractHttpAdapter, HttpAdapterHost } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpResponse } from '../models/http-response.model';

@Injectable()
export class ResponseTransformerInterceptor implements NestInterceptor {
  private readonly httpAdapter: AbstractHttpAdapter;

  public constructor(adapterHost: HttpAdapterHost) {
    this.httpAdapter = adapterHost.httpAdapter;
  }

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => value instanceof HttpResponse ? this.transform(context, value) : value),
    );
  }

  private transform(context: ExecutionContext, response: HttpResponse<unknown>): unknown {
    const nativeResponse = context.switchToHttp().getResponse();

    for (const [name, value] of Object.entries(response.headers)) {
      this.httpAdapter.setHeader(nativeResponse, name, value);
    }

    this.httpAdapter.status(nativeResponse, response.status);
    return response.body;
  }
}
