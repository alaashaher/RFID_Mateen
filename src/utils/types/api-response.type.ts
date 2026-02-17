export class ResponseShape<type> {
  success?: boolean;
  message?: string;
  data?: type;
  statusText?: string;
}

export class ApiResponse<type> {
  data!: ResponseShape<type>;
}
