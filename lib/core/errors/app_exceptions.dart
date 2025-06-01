/// Base exception class for all application-specific exceptions
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic details;

  const AppException(this.message, {this.code, this.details});

  @override
  String toString() => 'AppException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Database-related exceptions
class DatabaseException extends AppException {
  const DatabaseException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'DatabaseException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// File processing exceptions
class FileProcessingException extends AppException {
  const FileProcessingException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'FileProcessingException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Email validation exceptions
class EmailValidationException extends AppException {
  const EmailValidationException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'EmailValidationException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Web scraping exceptions
class WebScrapingException extends AppException {
  const WebScrapingException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'WebScrapingException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Email sending exceptions
class EmailSendingException extends AppException {
  const EmailSendingException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'EmailSendingException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Network-related exceptions
class NetworkException extends AppException {
  const NetworkException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'NetworkException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Rate limiting exceptions
class RateLimitException extends AppException {
  final DateTime? retryAfter;
  
  const RateLimitException(String message, {String? code, dynamic details, this.retryAfter})
      : super(message, code: code, details: details);

  @override
  String toString() => 'RateLimitException: $message${code != null ? ' (Code: $code)' : ''}${retryAfter != null ? ' (Retry after: $retryAfter)' : ''}';
}

/// Authentication/Authorization exceptions
class AuthenticationException extends AppException {
  const AuthenticationException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'AuthenticationException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Validation exceptions
class ValidationException extends AppException {
  final Map<String, List<String>>? fieldErrors;

  const ValidationException(String message, {String? code, dynamic details, this.fieldErrors})
      : super(message, code: code, details: details);

  @override
  String toString() => 'ValidationException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Configuration exceptions
class ConfigurationException extends AppException {
  const ConfigurationException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'ConfigurationException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// GDPR Compliance exceptions
class ComplianceException extends AppException {
  const ComplianceException(String message, {String? code, dynamic details})
      : super(message, code: code, details: details);

  @override
  String toString() => 'ComplianceException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Enum for common error types
enum AppError {
  // File operations
  fileUploadFailed,
  invalidCsvStructure,
  fileNotFound,
  fileAccessDenied,
  unsupportedFileFormat,
  
  // Network operations
  networkTimeout,
  connectionFailed,
  serverError,
  
  // Email operations
  emailSendingFailed,
  invalidEmailFormat,
  emailProviderError,
  dailyLimitExceeded,
  hourlyLimitExceeded,
  
  // Database operations
  databaseConnectionError,
  dataIntegrityError,
  duplicateEntry,
  
  // Authentication
  apiKeyInvalid,
  authenticationFailed,
  authorizationFailed,
  
  // Validation
  requiredFieldMissing,
  invalidDataFormat,
  dataValidationFailed,
  
  // Business logic
  operationNotAllowed,
  insufficientPermissions,
  resourceNotFound,
  
  // Compliance
  consentNotGiven,
  gdprViolation,
  unsubscribeRequestFailed,
}

/// Error code mappings for user-friendly messages
class ErrorMessages {
  static const Map<AppError, String> userFriendlyMessages = {
    // File operations
    AppError.fileUploadFailed: 'Unable to upload file. Please check the file format and try again.',
    AppError.invalidCsvStructure: 'Invalid CSV format. Please ensure your file has proper headers and structure.',
    AppError.fileNotFound: 'File not found. Please select a valid file.',
    AppError.fileAccessDenied: 'Cannot access file. Please check file permissions.',
    AppError.unsupportedFileFormat: 'Unsupported file format. Please use CSV files only.',
    
    // Network operations
    AppError.networkTimeout: 'Connection timeout. Please check your internet connection and try again.',
    AppError.connectionFailed: 'Unable to connect to server. Please try again later.',
    AppError.serverError: 'Server error occurred. Please try again later.',
    
    // Email operations
    AppError.emailSendingFailed: 'Failed to send email. Please check your email configuration.',
    AppError.invalidEmailFormat: 'Invalid email address format detected.',
    AppError.emailProviderError: 'Email provider error. Please check your API credentials.',
    AppError.dailyLimitExceeded: 'Daily email sending limit reached. Please try again tomorrow.',
    AppError.hourlyLimitExceeded: 'Hourly email sending limit reached. Please wait and try again.',
    
    // Database operations
    AppError.databaseConnectionError: 'Database connection error. Please restart the application.',
    AppError.dataIntegrityError: 'Data integrity error. Please contact support.',
    AppError.duplicateEntry: 'This record already exists in the database.',
    
    // Authentication
    AppError.apiKeyInvalid: 'Invalid API key. Please check your credentials.',
    AppError.authenticationFailed: 'Authentication failed. Please verify your credentials.',
    AppError.authorizationFailed: 'You do not have permission to perform this action.',
    
    // Validation
    AppError.requiredFieldMissing: 'Required field is missing. Please fill in all required fields.',
    AppError.invalidDataFormat: 'Invalid data format. Please check your input.',
    AppError.dataValidationFailed: 'Data validation failed. Please check your input.',
    
    // Business logic
    AppError.operationNotAllowed: 'This operation is not allowed at this time.',
    AppError.insufficientPermissions: 'Insufficient permissions to perform this action.',
    AppError.resourceNotFound: 'Requested resource not found.',
    
    // Compliance
    AppError.consentNotGiven: 'User consent is required before sending emails.',
    AppError.gdprViolation: 'This action would violate GDPR compliance requirements.',
    AppError.unsubscribeRequestFailed: 'Failed to process unsubscribe request.',
  };

  static String getMessage(AppError error) {
    return userFriendlyMessages[error] ?? 'An unexpected error occurred. Please try again.';
  }
}

/// Exception handler utility
class ExceptionHandler {
  static String getDisplayMessage(dynamic exception) {
    if (exception is AppException) {
      return exception.message;
    } else if (exception is Exception) {
      return 'An unexpected error occurred: ${exception.toString()}';
    } else {
      return 'An unknown error occurred. Please try again.';
    }
  }

  static AppError? getErrorType(dynamic exception) {
    if (exception is DatabaseException) {
      if (exception.message.contains('UNIQUE constraint failed')) {
        return AppError.duplicateEntry;
      }
      return AppError.databaseConnectionError;
    } else if (exception is FileProcessingException) {
      return AppError.invalidCsvStructure;
    } else if (exception is EmailValidationException) {
      return AppError.invalidEmailFormat;
    } else if (exception is EmailSendingException) {
      if (exception.message.contains('daily limit')) {
        return AppError.dailyLimitExceeded;
      } else if (exception.message.contains('hourly limit')) {
        return AppError.hourlyLimitExceeded;
      }
      return AppError.emailSendingFailed;
    } else if (exception is NetworkException) {
      if (exception.message.contains('timeout')) {
        return AppError.networkTimeout;
      }
      return AppError.connectionFailed;
    } else if (exception is RateLimitException) {
      return AppError.dailyLimitExceeded;
    } else if (exception is AuthenticationException) {
      return AppError.authenticationFailed;
    } else if (exception is ValidationException) {
      return AppError.dataValidationFailed;
    } else if (exception is ComplianceException) {
      return AppError.gdprViolation;
    }
    
    return null;
  }
} 