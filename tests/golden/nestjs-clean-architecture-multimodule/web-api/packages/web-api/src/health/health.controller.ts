import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { HttpResponseBuilder } from '../commons/models/http-response.builder';
import { HttpResponse } from '../commons/models/http-response.model';
import { HealthResponse } from './health-response.model';

@Controller()
export class HealthController {
  @ApiExcludeEndpoint()
  @Get('/health-check/live')
  public live(): HttpResponse<HealthResponse> {
    return new HttpResponseBuilder<HealthResponse>()
      .withBody(new HealthResponse())
      .build();
  }

  @ApiExcludeEndpoint()
  @Get('/health-check/ready')
  public ready(): HttpResponse<HealthResponse> {
    return new HttpResponseBuilder<HealthResponse>()
      .withBody(new HealthResponse())
      .build();
  }
}
