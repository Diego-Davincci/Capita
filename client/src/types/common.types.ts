export interface ApiRsp<t> {
  data: t;
  message: string;
  statusCode: number;
}
