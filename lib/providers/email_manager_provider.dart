import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:logger/logger.dart';
import 'dart:io';

import '../core/database/database_helper.dart';
import '../core/errors/app_exceptions.dart';
import '../features/email_extraction/csv_processor.dart';
import '../features/email_extraction/web_scraper.dart';
import '../features/email_sending/email_service.dart';
import '../models/contact_model.dart';

class EmailManagerProvider extends ChangeNotifier {
  final Logger _logger = Logger();
  final DatabaseHelper _databaseHelper = DatabaseHelper();
  final CsvProcessor _csvProcessor = CsvProcessor();
  final WebScraper _webScraper = WebScraper();
  final EmailService _emailService = EmailService();

  // State management
  bool _isInitialized = false;
  bool _isLoading = false;
  String? _currentError;
  
  // Data
  List<ContactModel> _contacts = [];
  EmailStatistics? _emailStatistics;
  ProcessingSummary? _lastProcessingSummary;
  
  // Email sending state
  bool _isEmailServiceConfigured = false;
  BulkEmailProgress? _currentEmailProgress;
  
  // Getters
  bool get isInitialized => _isInitialized;
  bool get isLoading => _isLoading;
  String? get currentError => _currentError;
  List<ContactModel> get contacts => _contacts;
  EmailStatistics? get emailStatistics => _emailStatistics;
  ProcessingSummary? get lastProcessingSummary => _lastProcessingSummary;
  bool get isEmailServiceConfigured => _isEmailServiceConfigured;
  BulkEmailProgress? get currentEmailProgress => _currentEmailProgress;
  
  // Derived getters
  List<ContactModel> get validContacts => _contacts.where((c) => c.isValidEmail).toList();
  List<ContactModel> get eligibleContacts => _contacts.where((c) => c.canReceiveEmails).toList();
  List<ContactModel> get csvContacts => _contacts.where((c) => c.source == 'csv').toList();
  List<ContactModel> get webContacts => _contacts.where((c) => c.source == 'web').toList();

  /// Initialize the email manager
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      _setLoading(true);
      _logger.i('Initializing Email Manager Provider');
      
      // Initialize database
      await _databaseHelper.database;
      
      // Load existing contacts
      await loadContacts();
      
      // Try to load email service credentials
      try {
        await _emailService.loadCredentials();
        _isEmailServiceConfigured = true;
        _logger.i('Email service credentials loaded successfully');
      } catch (e) {
        _logger.w('No email service credentials found: $e');
        _isEmailServiceConfigured = false;
      }
      
      // Load email statistics
      await _loadEmailStatistics();
      
      _isInitialized = true;
      _logger.i('Email Manager Provider initialized successfully');
      
    } catch (e) {
      _logger.e('Failed to initialize Email Manager Provider: $e');
      _setError('Failed to initialize: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Load contacts from database
  Future<void> loadContacts() async {
    try {
      _setLoading(true);
      _contacts = await _databaseHelper.getAllContacts();
      _logger.i('Loaded ${_contacts.length} contacts from database');
      notifyListeners();
    } catch (e) {
      _logger.e('Failed to load contacts: $e');
      _setError('Failed to load contacts: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Process CSV file
  Future<void> processCsvFile() async {
    try {
      _setLoading(true);
      _clearError();
      
      // Pick CSV file
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'txt'],
        allowMultiple: false,
      );
      
      if (result == null || result.files.isEmpty) {
        _logger.i('CSV file selection cancelled');
        return;
      }
      
      final filePath = result.files.first.path;
      if (filePath == null) {
        throw FileProcessingException('Invalid file path');
      }
      
      final file = File(filePath);
      _logger.i('Processing CSV file: ${file.path}');
      
      // Process CSV file
      final csvResult = await _csvProcessor.processCsvFile(file);
      
      // Store contacts in database
      if (csvResult.validContacts.isNotEmpty) {
        await _databaseHelper.insertContactsBatch(csvResult.validContacts);
        _logger.i('Stored ${csvResult.validContacts.length} contacts from CSV');
      }
      
      // Update contacts list
      await loadContacts();
      
      // Update statistics
      await _loadEmailStatistics();
      
      // Create processing summary
      _lastProcessingSummary = ProcessingSummary(
        emailsExtracted: csvResult.totalValidContacts,
        namesExtracted: csvResult.totalValidContacts,
        validEmails: csvResult.totalValidContacts,
        invalidEmails: csvResult.totalInvalidContacts,
        duplicatesFound: csvResult.totalDuplicates,
        emailsSent: 0,
        emailsFailed: 0,
        databaseCreated: true,
        emailFunctionImplemented: _isEmailServiceConfigured,
        dailyLimitRemaining: _emailStatistics?.dailyLimitRemaining ?? 0,
        processingStartTime: DateTime.now().subtract(const Duration(seconds: 1)),
        processingEndTime: DateTime.now(),
        totalProcessingTime: const Duration(seconds: 1),
        source: 'CSV',
        fileName: file.path.split('/').last,
        successRate: csvResult.successRate,
      );
      
      _logger.i('CSV processing completed successfully');
      
    } catch (e) {
      _logger.e('CSV processing failed: $e');
      _setError('CSV processing failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Process web URL for email extraction
  Future<void> processWebUrl(String url) async {
    try {
      _setLoading(true);
      _clearError();
      
      if (url.trim().isEmpty) {
        throw WebScrapingException('URL cannot be empty');
      }
      
      _logger.i('Processing web URL: $url');
      
      // Scrape emails from URL
      final webResult = await _webScraper.scrapeEmails(url.trim());
      
      // Store contacts in database
      if (webResult.validContacts.isNotEmpty) {
        await _databaseHelper.insertContactsBatch(webResult.validContacts);
        _logger.i('Stored ${webResult.validContacts.length} contacts from web scraping');
      }
      
      // Update contacts list
      await loadContacts();
      
      // Update statistics
      await _loadEmailStatistics();
      
      // Create processing summary
      _lastProcessingSummary = ProcessingSummary(
        emailsExtracted: webResult.totalValidContacts,
        namesExtracted: webResult.totalValidContacts,
        validEmails: webResult.totalValidContacts,
        invalidEmails: webResult.totalInvalidContacts,
        duplicatesFound: webResult.totalDuplicates,
        emailsSent: 0,
        emailsFailed: 0,
        databaseCreated: true,
        emailFunctionImplemented: _isEmailServiceConfigured,
        dailyLimitRemaining: _emailStatistics?.dailyLimitRemaining ?? 0,
        processingStartTime: DateTime.now().subtract(const Duration(seconds: 2)),
        processingEndTime: DateTime.now(),
        totalProcessingTime: const Duration(seconds: 2),
        source: 'Web',
        fileName: url,
        successRate: webResult.successRate,
      );
      
      _logger.i('Web scraping completed successfully');
      
    } catch (e) {
      _logger.e('Web scraping failed: $e');
      _setError('Web scraping failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Configure email service
  Future<void> configureEmailService({
    required String apiKey,
    required String senderEmail,
    required String senderName,
  }) async {
    try {
      _setLoading(true);
      _clearError();
      
      await _emailService.initialize(
        apiKey: apiKey,
        senderEmail: senderEmail,
        senderName: senderName,
      );
      
      _isEmailServiceConfigured = true;
      await _loadEmailStatistics();
      
      _logger.i('Email service configured successfully');
      
    } catch (e) {
      _logger.e('Email service configuration failed: $e');
      _setError('Email service configuration failed: $e');
      _isEmailServiceConfigured = false;
    } finally {
      _setLoading(false);
    }
  }

  /// Send email to single contact
  Future<EmailSendResult> sendEmailToContact({
    required ContactModel contact,
    required String subject,
    required String content,
  }) async {
    try {
      if (!_isEmailServiceConfigured) {
        throw EmailSendingException('Email service not configured');
      }
      
      final result = await _emailService.sendEmail(
        contact: contact,
        subject: subject,
        content: content,
      );
      
      // Update statistics after send
      await _loadEmailStatistics();
      
      // Update contact in local list if successful
      if (result.success) {
        final index = _contacts.indexWhere((c) => c.id == contact.id);
        if (index != -1) {
          _contacts[index] = contact.markEmailSent();
          notifyListeners();
        }
      }
      
      return result;
      
    } catch (e) {
      _logger.e('Failed to send email to ${contact.email}: $e');
      throw EmailSendingException('Failed to send email: $e');
    }
  }

  /// Send bulk emails
  Future<BulkEmailResult> sendBulkEmails({
    required List<ContactModel> contacts,
    required String subject,
    required String content,
  }) async {
    try {
      if (!_isEmailServiceConfigured) {
        throw EmailSendingException('Email service not configured');
      }
      
      _currentEmailProgress = null;
      notifyListeners();
      
      final result = await _emailService.sendBulkEmails(
        contacts: contacts,
        subject: subject,
        content: content,
        onProgress: (progress) {
          _currentEmailProgress = progress;
          notifyListeners();
        },
      );
      
      // Clear progress when complete
      _currentEmailProgress = null;
      
      // Update statistics and contacts
      await _loadEmailStatistics();
      await loadContacts();
      
      return result;
      
    } catch (e) {
      _currentEmailProgress = null;
      notifyListeners();
      _logger.e('Bulk email send failed: $e');
      throw EmailSendingException('Bulk email send failed: $e');
    }
  }

  /// Update contact
  Future<void> updateContact(ContactModel contact) async {
    try {
      await _databaseHelper.updateContact(contact);
      
      // Update in local list
      final index = _contacts.indexWhere((c) => c.id == contact.id);
      if (index != -1) {
        _contacts[index] = contact;
        notifyListeners();
      }
      
      await _loadEmailStatistics();
      
    } catch (e) {
      _logger.e('Failed to update contact: $e');
      _setError('Failed to update contact: $e');
    }
  }

  /// Delete contact
  Future<void> deleteContact(ContactModel contact) async {
    try {
      if (contact.id != null) {
        await _databaseHelper.deleteContact(contact.id!);
        _contacts.removeWhere((c) => c.id == contact.id);
        notifyListeners();
        await _loadEmailStatistics();
      }
    } catch (e) {
      _logger.e('Failed to delete contact: $e');
      _setError('Failed to delete contact: $e');
    }
  }

  /// Process unsubscribe request
  Future<void> processUnsubscribe(String email) async {
    try {
      await _emailService.processUnsubscribe(email);
      await loadContacts();
      await _loadEmailStatistics();
      _logger.i('Unsubscribe processed for $email');
    } catch (e) {
      _logger.e('Failed to process unsubscribe: $e');
      _setError('Failed to process unsubscribe: $e');
    }
  }

  /// Clear all data
  Future<void> clearAllData() async {
    try {
      _setLoading(true);
      await _databaseHelper.clearAllData();
      _contacts.clear();
      _emailStatistics = null;
      _lastProcessingSummary = null;
      notifyListeners();
      _logger.i('All data cleared');
    } catch (e) {
      _logger.e('Failed to clear data: $e');
      _setError('Failed to clear data: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Clear email credentials
  Future<void> clearEmailCredentials() async {
    try {
      await _emailService.clearCredentials();
      _isEmailServiceConfigured = false;
      notifyListeners();
      _logger.i('Email credentials cleared');
    } catch (e) {
      _logger.e('Failed to clear email credentials: $e');
      _setError('Failed to clear email credentials: $e');
    }
  }

  /// Load email statistics
  Future<void> _loadEmailStatistics() async {
    try {
      if (_isEmailServiceConfigured) {
        _emailStatistics = await _emailService.getEmailStatistics();
      } else {
        final stats = await _databaseHelper.getContactStatistics();
        _emailStatistics = EmailStatistics(
          totalContacts: stats['totalContacts'] as int,
          validEmails: stats['validEmails'] as int,
          totalEmailsSent: 0,
          emailsDelivered: 0,
          emailsBounced: 0,
          emailsSentToday: 0,
          dailyLimitRemaining: 30,
          bounceRate: 0.0,
          deliveryRate: 0.0,
        );
      }
      notifyListeners();
    } catch (e) {
      _logger.e('Failed to load email statistics: $e');
    }
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Set error state
  void _setError(String error) {
    _currentError = error;
    notifyListeners();
  }

  /// Clear error state
  void _clearError() {
    _currentError = null;
    notifyListeners();
  }

  /// Refresh all data
  Future<void> refresh() async {
    await loadContacts();
    await _loadEmailStatistics();
  }

  @override
  void dispose() {
    _databaseHelper.close();
    super.dispose();
  }
}

/// Processing summary class
class ProcessingSummary {
  final int emailsExtracted;
  final int namesExtracted;
  final int validEmails;
  final int invalidEmails;
  final int duplicatesFound;
  final int emailsSent;
  final int emailsFailed;
  final bool databaseCreated;
  final bool emailFunctionImplemented;
  final int dailyLimitRemaining;
  final DateTime processingStartTime;
  final DateTime processingEndTime;
  final Duration totalProcessingTime;
  final String source;
  final String fileName;
  final double successRate;

  ProcessingSummary({
    required this.emailsExtracted,
    required this.namesExtracted,
    required this.validEmails,
    required this.invalidEmails,
    required this.duplicatesFound,
    required this.emailsSent,
    required this.emailsFailed,
    required this.databaseCreated,
    required this.emailFunctionImplemented,
    required this.dailyLimitRemaining,
    required this.processingStartTime,
    required this.processingEndTime,
    required this.totalProcessingTime,
    required this.source,
    required this.fileName,
    required this.successRate,
  });

  Map<String, dynamic> toJson() {
    return {
      'emailsExtracted': emailsExtracted,
      'namesExtracted': namesExtracted,
      'validEmails': validEmails,
      'invalidEmails': invalidEmails,
      'duplicatesFound': duplicatesFound,
      'emailsSent': emailsSent,
      'emailsFailed': emailsFailed,
      'databaseCreated': databaseCreated,
      'emailFunctionImplemented': emailFunctionImplemented,
      'dailyLimitRemaining': dailyLimitRemaining,
      'processingStartTime': processingStartTime.toIso8601String(),
      'processingEndTime': processingEndTime.toIso8601String(),
      'totalProcessingTime': totalProcessingTime.inMilliseconds,
      'source': source,
      'fileName': fileName,
      'successRate': successRate,
    };
  }
} 