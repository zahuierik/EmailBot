import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import '../../core/errors/app_exceptions.dart';
import '../../core/database/database_helper.dart';
import '../../models/contact_model.dart';

class EmailService {
  final Logger _logger = Logger();
  final DatabaseHelper _databaseHelper = DatabaseHelper();
  
  // SendGrid configuration
  static const String _sendGridBaseUrl = 'https://api.sendgrid.com/v3';
  static const String _sendEndpoint = '/mail/send';
  
  // Rate limiting configuration
  static const int _dailyEmailLimit = 30; // Conservative daily limit for cold outreach
  static const int _hourlyEmailLimit = 5;  // Spread sends across business hours
  static const Duration _minimumInterval = Duration(minutes: 12); // 5 emails per hour max
  
  String? _apiKey;
  String? _senderEmail;
  String? _senderName;

  /// Initialize email service with API credentials
  Future<void> initialize({
    required String apiKey,
    required String senderEmail,
    required String senderName,
  }) async {
    try {
      _apiKey = apiKey;
      _senderEmail = senderEmail;
      _senderName = senderName;
      
      // Store credentials securely
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('sendgrid_api_key', apiKey);
      await prefs.setString('sender_email', senderEmail);
      await prefs.setString('sender_name', senderName);
      
      // Verify API key and sender email
      await _verifyCredentials();
      
      _logger.i('Email service initialized successfully');
    } catch (e) {
      _logger.e('Failed to initialize email service: $e');
      throw EmailSendingException('Email service initialization failed: $e');
    }
  }

  /// Load saved credentials from secure storage
  Future<void> loadCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _apiKey = prefs.getString('sendgrid_api_key');
      _senderEmail = prefs.getString('sender_email');
      _senderName = prefs.getString('sender_name');
      
      if (_apiKey == null || _senderEmail == null) {
        throw EmailSendingException('Email credentials not found. Please configure email settings.');
      }
      
      await _verifyCredentials();
    } catch (e) {
      _logger.e('Failed to load email credentials: $e');
      rethrow;
    }
  }

  /// Verify API credentials with SendGrid
  Future<void> _verifyCredentials() async {
    if (_apiKey == null) {
      throw AuthenticationException('SendGrid API key not provided');
    }

    try {
      final client = http.Client();
      final response = await client.get(
        Uri.parse('$_sendGridBaseUrl/user/account'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
      );
      
      client.close();
      
      if (response.statusCode == 200) {
        _logger.i('SendGrid API credentials verified successfully');
      } else if (response.statusCode == 401) {
        throw AuthenticationException('Invalid SendGrid API key');
      } else {
        throw EmailSendingException('Failed to verify credentials: ${response.statusCode}');
      }
    } catch (e) {
      if (e is AppException) rethrow;
      throw EmailSendingException('Credential verification failed: $e');
    }
  }

  /// Send email to a single contact with GDPR compliance checks
  Future<EmailSendResult> sendEmail({
    required ContactModel contact,
    required String subject,
    required String content,
    String? campaignId,
    bool checkConsent = true,
  }) async {
    try {
      _logger.i('Sending email to ${contact.email}');
      
      // GDPR compliance checks
      if (checkConsent && !contact.canReceiveEmails) {
        return EmailSendResult(
          contact: contact,
          success: false,
          error: 'Contact cannot receive emails: ${_getComplianceReason(contact)}',
          complianceViolation: true,
        );
      }
      
      // Rate limiting checks
      final rateLimitCheck = await _checkRateLimits();
      if (!rateLimitCheck.allowed) {
        return EmailSendResult(
          contact: contact,
          success: false,
          error: rateLimitCheck.reason!,
          rateLimited: true,
        );
      }
      
      // Send email via SendGrid
      final sendGridResult = await _sendViaSendGrid(
        toEmail: contact.email,
        toName: contact.name,
        subject: subject,
        content: content,
      );
      
      // Log email attempt
      await _logEmailAttempt(
        contact: contact,
        subject: subject,
        success: sendGridResult.success,
        providerResponse: sendGridResult.response,
        providerMessageId: sendGridResult.messageId,
        errorMessage: sendGridResult.error,
        campaignId: campaignId,
      );
      
      // Update contact statistics if successful
      if (sendGridResult.success) {
        await _updateContactAfterSend(contact);
      }
      
      return EmailSendResult(
        contact: contact,
        success: sendGridResult.success,
        messageId: sendGridResult.messageId,
        error: sendGridResult.error,
        providerResponse: sendGridResult.response,
      );
      
    } catch (e) {
      _logger.e('Error sending email to ${contact.email}: $e');
      
      // Log failed attempt
      await _logEmailAttempt(
        contact: contact,
        subject: subject,
        success: false,
        errorMessage: e.toString(),
        campaignId: campaignId,
      );
      
      return EmailSendResult(
        contact: contact,
        success: false,
        error: 'Failed to send email: $e',
      );
    }
  }

  /// Send bulk emails with rate limiting and progress tracking
  Future<BulkEmailResult> sendBulkEmails({
    required List<ContactModel> contacts,
    required String subject,
    required String content,
    String? campaignId,
    Function(BulkEmailProgress)? onProgress,
  }) async {
    final results = <EmailSendResult>[];
    final startTime = DateTime.now();
    int successCount = 0;
    int failedCount = 0;
    int skippedCount = 0;
    
    _logger.i('Starting bulk email send to ${contacts.length} contacts');
    
    try {
      for (int i = 0; i < contacts.length; i++) {
        final contact = contacts[i];
        
        // Check daily limits before each send
        final rateLimitCheck = await _checkRateLimits();
        if (!rateLimitCheck.allowed) {
          _logger.w('Rate limit reached, stopping bulk send: ${rateLimitCheck.reason}');
          
          // Mark remaining contacts as skipped
          for (int j = i; j < contacts.length; j++) {
            results.add(EmailSendResult(
              contact: contacts[j],
              success: false,
              error: rateLimitCheck.reason!,
              rateLimited: true,
            ));
            skippedCount++;
          }
          break;
        }
        
        // Send email to current contact
        final result = await sendEmail(
          contact: contact,
          subject: subject,
          content: content,
          campaignId: campaignId,
        );
        
        results.add(result);
        
        if (result.success) {
          successCount++;
        } else {
          if (result.complianceViolation || result.rateLimited) {
            skippedCount++;
          } else {
            failedCount++;
          }
        }
        
        // Progress callback
        onProgress?.call(BulkEmailProgress(
          totalContacts: contacts.length,
          processed: i + 1,
          successful: successCount,
          failed: failedCount,
          skipped: skippedCount,
          currentContact: contact,
          isComplete: i == contacts.length - 1,
        ));
        
        // Rate limiting delay between sends
        if (i < contacts.length - 1 && result.success) {
          await Future.delayed(_minimumInterval);
        }
      }
      
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime);
      
      _logger.i('Bulk email send completed: $successCount successful, $failedCount failed, $skippedCount skipped');
      
      return BulkEmailResult(
        totalContacts: contacts.length,
        successCount: successCount,
        failedCount: failedCount,
        skippedCount: skippedCount,
        results: results,
        duration: duration,
        startTime: startTime,
        endTime: endTime,
      );
      
    } catch (e) {
      _logger.e('Bulk email send error: $e');
      throw EmailSendingException('Bulk email send failed: $e');
    }
  }

  /// Send email via SendGrid API
  Future<SendGridResult> _sendViaSendGrid({
    required String toEmail,
    required String toName,
    required String subject,
    required String content,
  }) async {
    if (_apiKey == null || _senderEmail == null) {
      throw EmailSendingException('Email service not initialized');
    }

    try {
      final client = http.Client();
      
      // Create SendGrid email payload
      final payload = {
        'personalizations': [
          {
            'to': [
              {
                'email': toEmail,
                'name': toName,
              }
            ],
            'subject': subject,
          }
        ],
        'from': {
          'email': _senderEmail,
          'name': _senderName ?? _senderEmail,
        },
        'content': [
          {
            'type': 'text/html',
            'value': content,
          }
        ],
        'tracking_settings': {
          'click_tracking': {
            'enable': true,
          },
          'open_tracking': {
            'enable': true,
          },
        },
        'reply_to': {
          'email': _senderEmail,
          'name': _senderName ?? _senderEmail,
        },
      };
      
      final response = await client.post(
        Uri.parse('$_sendGridBaseUrl$_sendEndpoint'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );
      
      client.close();
      
      if (response.statusCode == 202) {
        // Extract message ID from response headers
        final messageId = response.headers['x-message-id'];
        
        return SendGridResult(
          success: true,
          response: 'Email queued successfully',
          messageId: messageId,
        );
      } else {
        final errorBody = response.body.isNotEmpty ? response.body : 'No error details';
        
        if (response.statusCode == 429) {
          throw RateLimitException('SendGrid rate limit exceeded');
        } else if (response.statusCode == 401) {
          throw AuthenticationException('Invalid SendGrid API key');
        } else if (response.statusCode >= 400 && response.statusCode < 500) {
          throw EmailSendingException('Client error ${response.statusCode}: $errorBody');
        } else {
          throw EmailSendingException('Server error ${response.statusCode}: $errorBody');
        }
      }
      
    } catch (e) {
      if (e is AppException) rethrow;
      throw EmailSendingException('SendGrid API error: $e');
    }
  }

  /// Check rate limits for email sending
  Future<RateLimitResult> _checkRateLimits() async {
    try {
      final now = DateTime.now();
      final todayStart = DateTime(now.year, now.month, now.day);
      final hourStart = DateTime(now.year, now.month, now.day, now.hour);
      
      // Get email counts from database
      final todayCount = await _getEmailsSentSince(todayStart);
      final hourCount = await _getEmailsSentSince(hourStart);
      
      // Check daily limit
      if (todayCount >= _dailyEmailLimit) {
        return RateLimitResult(
          allowed: false,
          reason: 'Daily email limit reached ($_dailyEmailLimit emails)',
          nextAllowedTime: todayStart.add(const Duration(days: 1)),
        );
      }
      
      // Check hourly limit
      if (hourCount >= _hourlyEmailLimit) {
        return RateLimitResult(
          allowed: false,
          reason: 'Hourly email limit reached ($_hourlyEmailLimit emails)',
          nextAllowedTime: hourStart.add(const Duration(hours: 1)),
        );
      }
      
      // Check minimum interval since last email
      final lastEmailTime = await _getLastEmailTime();
      if (lastEmailTime != null) {
        final timeSinceLastEmail = now.difference(lastEmailTime);
        if (timeSinceLastEmail < _minimumInterval) {
          final nextAllowed = lastEmailTime.add(_minimumInterval);
          return RateLimitResult(
            allowed: false,
            reason: 'Minimum interval not met (${_minimumInterval.inMinutes} minutes between emails)',
            nextAllowedTime: nextAllowed,
          );
        }
      }
      
      return RateLimitResult(
        allowed: true,
        remainingToday: _dailyEmailLimit - todayCount,
        remainingThisHour: _hourlyEmailLimit - hourCount,
      );
      
    } catch (e) {
      _logger.e('Error checking rate limits: $e');
      throw EmailSendingException('Rate limit check failed: $e');
    }
  }

  /// Get number of emails sent since a specific time
  Future<int> _getEmailsSentSince(DateTime since) async {
    try {
      final db = await _databaseHelper.database;
      final result = await db.rawQuery(
        'SELECT COUNT(*) as count FROM ${DatabaseHelper.emailLogsTable} '
        'WHERE sent_at >= ? AND status = ?',
        [since.toIso8601String(), 'sent']
      );
      
      return (result.first['count'] as int?) ?? 0;
    } catch (e) {
      _logger.e('Error getting emails sent count: $e');
      return 0;
    }
  }

  /// Get timestamp of last sent email
  Future<DateTime?> _getLastEmailTime() async {
    try {
      final db = await _databaseHelper.database;
      final result = await db.rawQuery(
        'SELECT MAX(sent_at) as last_sent FROM ${DatabaseHelper.emailLogsTable} '
        'WHERE status = ?',
        ['sent']
      );
      
      final lastSentStr = result.first['last_sent'] as String?;
      return lastSentStr != null ? DateTime.parse(lastSentStr) : null;
    } catch (e) {
      _logger.e('Error getting last email time: $e');
      return null;
    }
  }

  /// Log email attempt to database
  Future<void> _logEmailAttempt({
    required ContactModel contact,
    required String subject,
    required bool success,
    String? providerResponse,
    String? providerMessageId,
    String? errorMessage,
    String? campaignId,
  }) async {
    try {
      final db = await _databaseHelper.database;
      
      await db.insert(DatabaseHelper.emailLogsTable, {
        'contact_id': contact.id,
        'campaign_id': campaignId,
        'email_address': contact.email,
        'subject': subject,
        'status': success ? 'sent' : 'failed',
        'provider_response': providerResponse,
        'provider_message_id': providerMessageId,
        'error_message': errorMessage,
        'sent_at': DateTime.now().toIso8601String(),
      });
      
    } catch (e) {
      _logger.e('Error logging email attempt: $e');
      // Don't throw here as it would fail the email send
    }
  }

  /// Update contact after successful email send
  Future<void> _updateContactAfterSend(ContactModel contact) async {
    try {
      final updatedContact = contact.markEmailSent();
      await _databaseHelper.updateContact(updatedContact);
    } catch (e) {
      _logger.e('Error updating contact after send: $e');
      // Don't throw here as email was already sent successfully
    }
  }

  /// Get GDPR compliance reason for contact
  String _getComplianceReason(ContactModel contact) {
    final reasons = <String>[];
    
    if (!contact.isActive) reasons.add('Contact is inactive');
    if (contact.unsubscribed) reasons.add('Contact has unsubscribed');
    if (!contact.isValidEmail) reasons.add('Invalid email address');
    if (!contact.hasValidEmailFormat) reasons.add('Invalid email format');
    if (!contact.consentGiven) reasons.add('No consent given');
    
    return reasons.join(', ');
  }

  /// Get email sending statistics
  Future<EmailStatistics> getEmailStatistics() async {
    try {
      final stats = await _databaseHelper.getContactStatistics();
      
      final db = await _databaseHelper.database;
      
      // Get additional email-specific stats
      final totalEmailsSent = (await db.rawQuery(
        'SELECT COUNT(*) as count FROM ${DatabaseHelper.emailLogsTable} WHERE status = ?',
        ['sent']
      )).first['count'] as int? ?? 0;
      
      final emailsDelivered = (await db.rawQuery(
        'SELECT COUNT(*) as count FROM ${DatabaseHelper.emailLogsTable} WHERE status = ?',
        ['delivered']
      )).first['count'] as int? ?? 0;
      
      final emailsBounced = (await db.rawQuery(
        'SELECT COUNT(*) as count FROM ${DatabaseHelper.emailLogsTable} WHERE status = ?',
        ['bounced']
      )).first['count'] as int? ?? 0;
      
      final now = DateTime.now();
      final todayStart = DateTime(now.year, now.month, now.day);
      
      final emailsSentToday = await _getEmailsSentSince(todayStart);
      final remainingToday = _dailyEmailLimit - emailsSentToday;
      
      return EmailStatistics(
        totalContacts: stats['totalContacts'] as int,
        validEmails: stats['validEmails'] as int,
        totalEmailsSent: totalEmailsSent,
        emailsDelivered: emailsDelivered,
        emailsBounced: emailsBounced,
        emailsSentToday: emailsSentToday,
        dailyLimitRemaining: remainingToday.clamp(0, _dailyEmailLimit),
        bounceRate: stats['bounceRate'] as double,
        deliveryRate: totalEmailsSent > 0 ? (emailsDelivered / totalEmailsSent) * 100 : 0.0,
      );
      
    } catch (e) {
      _logger.e('Error getting email statistics: $e');
      throw EmailSendingException('Failed to get email statistics: $e');
    }
  }

  /// Process unsubscribe request
  Future<void> processUnsubscribe(String email) async {
    try {
      final contact = await _databaseHelper.getContactByEmail(email);
      
      if (contact != null) {
        final unsubscribedContact = contact.unsubscribe();
        await _databaseHelper.updateContact(unsubscribedContact);
        
        _logger.i('Contact $email has been unsubscribed');
      } else {
        _logger.w('Unsubscribe request for unknown email: $email');
      }
      
    } catch (e) {
      _logger.e('Error processing unsubscribe for $email: $e');
      throw EmailSendingException('Failed to process unsubscribe: $e');
    }
  }

  /// Clear email credentials
  Future<void> clearCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('sendgrid_api_key');
      await prefs.remove('sender_email');
      await prefs.remove('sender_name');
      
      _apiKey = null;
      _senderEmail = null;
      _senderName = null;
      
      _logger.i('Email credentials cleared');
    } catch (e) {
      _logger.e('Error clearing credentials: $e');
      throw EmailSendingException('Failed to clear credentials: $e');
    }
  }
}

/// Result classes for email operations
class EmailSendResult {
  final ContactModel contact;
  final bool success;
  final String? messageId;
  final String? error;
  final String? providerResponse;
  final bool complianceViolation;
  final bool rateLimited;

  EmailSendResult({
    required this.contact,
    required this.success,
    this.messageId,
    this.error,
    this.providerResponse,
    this.complianceViolation = false,
    this.rateLimited = false,
  });
}

class BulkEmailResult {
  final int totalContacts;
  final int successCount;
  final int failedCount;
  final int skippedCount;
  final List<EmailSendResult> results;
  final Duration duration;
  final DateTime startTime;
  final DateTime endTime;

  BulkEmailResult({
    required this.totalContacts,
    required this.successCount,
    required this.failedCount,
    required this.skippedCount,
    required this.results,
    required this.duration,
    required this.startTime,
    required this.endTime,
  });

  double get successRate => totalContacts > 0 ? (successCount / totalContacts) * 100 : 0;
  double get emailsPerMinute => duration.inMinutes > 0 ? successCount / duration.inMinutes : 0;
}

class BulkEmailProgress {
  final int totalContacts;
  final int processed;
  final int successful;
  final int failed;
  final int skipped;
  final ContactModel currentContact;
  final bool isComplete;

  BulkEmailProgress({
    required this.totalContacts,
    required this.processed,
    required this.successful,
    required this.failed,
    required this.skipped,
    required this.currentContact,
    required this.isComplete,
  });

  double get progressPercentage => totalContacts > 0 ? (processed / totalContacts) * 100 : 0;
}

class SendGridResult {
  final bool success;
  final String? response;
  final String? messageId;
  final String? error;

  SendGridResult({
    required this.success,
    this.response,
    this.messageId,
    this.error,
  });
}

class RateLimitResult {
  final bool allowed;
  final String? reason;
  final DateTime? nextAllowedTime;
  final int? remainingToday;
  final int? remainingThisHour;

  RateLimitResult({
    required this.allowed,
    this.reason,
    this.nextAllowedTime,
    this.remainingToday,
    this.remainingThisHour,
  });
}

class EmailStatistics {
  final int totalContacts;
  final int validEmails;
  final int totalEmailsSent;
  final int emailsDelivered;
  final int emailsBounced;
  final int emailsSentToday;
  final int dailyLimitRemaining;
  final double bounceRate;
  final double deliveryRate;

  EmailStatistics({
    required this.totalContacts,
    required this.validEmails,
    required this.totalEmailsSent,
    required this.emailsDelivered,
    required this.emailsBounced,
    required this.emailsSentToday,
    required this.dailyLimitRemaining,
    required this.bounceRate,
    required this.deliveryRate,
  });
} 