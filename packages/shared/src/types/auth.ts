import {type User}from "./user"

export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }
  
  export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    user: User;
  }
  
  export interface JwtPayload {
    sub: string;
    email: string;
  }