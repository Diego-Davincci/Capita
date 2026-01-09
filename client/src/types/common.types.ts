export interface ApiRsp<t> {
  data: t;
  message: string;
  statusCode: number;
}

export interface User {
  userID: number;
  email: string;
  username: string;
  picture: string;
  isUserValid: boolean;
}
