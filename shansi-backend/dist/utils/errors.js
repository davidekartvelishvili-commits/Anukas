export class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}
export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(400, message);
        this.name = "BadRequestError";
    }
}
export class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(429, message);
        this.name = "RateLimitError";
    }
}
//# sourceMappingURL=errors.js.map