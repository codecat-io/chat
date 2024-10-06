export class AppError extends Error {
  errorCode: string;

  constructor(public code: string, public message: string) {
    super(message);
    this.errorCode = code;
  }
}

export class ResourceNotFound extends AppError {
  constructor(message: string) {
    super("RESOURCE_NOT_FOUND", message);
  }
}

export class AccessDenied extends AppError {
  constructor() {
    super("ACCESS_DENIED", "Access denied");
  }
}

export class NotOwner extends AppError {
  constructor() {
    super("NOT_OWNER", "Not owner");
  }
}

export class InvalidMessage extends AppError {
  constructor(msg = "Invalid message") {
    super("INVALID_MESSAGE", msg);
  }
}
export class InvalidUser extends AppError {
  userIds: string[];
  constructor(msg = "Invalid user", userIds: string[]) {
    super("INVALID_USER", msg);
    this.userIds = userIds;
  }
}

export class InvalidInvitation extends AppError {
  constructor(msg = "Invalid invitation link") {
    super("INVALID_INVITATION", msg);
  }
}

export class InvalidChannelValue extends AppError {
  constructor(msg = "Can not create channel") {
    super("INVLID_CHANNEL_VALUE", msg);
  }
}
