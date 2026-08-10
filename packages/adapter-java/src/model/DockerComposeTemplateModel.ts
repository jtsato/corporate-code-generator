export interface DockerComposeTemplateModel {
  readonly serviceName: string;
  readonly buildContext: string;
  readonly dockerfile: string;
  readonly imageName: string;
  readonly imageTag: string;
  readonly hostPort: number;
  readonly containerPort: number;
  readonly restartPolicy: string;
}
