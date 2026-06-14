import { RoleType } from "../enums/roles.enum"

export interface SessionDto {
  accessToken:  string
  refreshToken: string
  userId:       string
  roles:        RoleType[]
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  roles: string[]
}


export interface LoginDto {
  email:    string
  password: string
}

export interface RefreshTokenDto {
  refreshToken: string
}