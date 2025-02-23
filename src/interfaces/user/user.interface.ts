export interface User {
  _id?: string;
  name?: string;
  username?: string;
  phoneNo?: string;
  email?: string;
  password?: string;
  gender?: string;
  profileImg?: string;
  joinDate?: string;
  occupation?: string;
  hasAccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserAuthResponse {
  success: boolean;
  token?: string;
  tokenExpiredIn?: number;
  data?: any;
  message?: string;
}

export interface UserJwtPayload {
  _id?: string;
  username: string;
}
