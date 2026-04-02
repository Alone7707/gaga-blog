export interface ApiSuccessResponse<T> {
  code: 'OK';
  message: 'success';
  data: T;
  requestId: string;
}
