export const USER_ROLES = {
  DRIVER: 'driver',
  OWNER: 'owner',
  ADMIN: 'admin',
};

export function isDriver(user) {
  return user?.role === USER_ROLES.DRIVER;
}

export function isOwner(user) {
  return user?.role === USER_ROLES.OWNER;
}

export function isAdmin(user) {
  return user?.role === USER_ROLES.ADMIN;
}

export function hasRole(user, roles) {
  return roles.includes(user?.role);
}
