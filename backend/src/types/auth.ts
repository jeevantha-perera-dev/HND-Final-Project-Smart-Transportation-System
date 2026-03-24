export const USER_ROLES = ["PASSENGER", "DRIVER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};

export type AuthedRequestContext = {
  userId: string;
  role: UserRole;
};
