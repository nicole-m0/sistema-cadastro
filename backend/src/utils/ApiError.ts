export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Não autenticado.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acesso negado.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Registro não encontrado.') {
    return new ApiError(404, message);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Erro interno do servidor.') {
    return new ApiError(500, message);
  }
}
