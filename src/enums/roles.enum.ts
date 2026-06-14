export enum RoleType {
  ROOT    = 'root',
  MANAGER = 'manager',
  STAFF   = 'staff',
  ADMIN   = 'admin',
  USER    = 'user',
}

export const STAFF_ROLES: RoleType[] = [
  RoleType.ROOT,
  RoleType.MANAGER,
  RoleType.STAFF,
  RoleType.ADMIN,
]