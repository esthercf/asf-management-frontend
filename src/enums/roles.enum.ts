export enum RoleType {
  Root = 'Root',
  Staff = 'Staff',
  Manager = 'Manager',
  //Jury = 'Jury',
  Contestant = 'Contestant',
  //Artist = 'Artist',
}

export const STAFF_ROLES: RoleType[] = [
  RoleType.Root,
  RoleType.Staff,
]

// This frontend is Management-only — both /staff (booking oversight)
// and /manager use this same, narrower set. Staff cannot log in here
// at all; they belong on the actual Booking frontend for day-to-day
// work, not this app.
export const ALLOWED_MANAGER_ROLES: RoleType[] = [
  RoleType.Root,
  RoleType.Manager,
]