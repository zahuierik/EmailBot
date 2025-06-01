import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:html/parser.dart' as html_parser;
import 'package:html/dom.dart';
import 'package:email_validator/email_validator.dart';
import 'package:logger/logger.dart';
import '../../core/errors/app_exceptions.dart';
import '../../models/contact_model.dart';

class WebScraper {
  final Logger _logger = Logger();
  static const int maxRetries = 3;
  static const Duration baseDelay = Duration(seconds: 2);
  
  // User agents for rotation to avoid detection
  static const List<String> userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ];

  /// Scrape emails from a given URL with anti-detection features
  Future<WebScrapingResult> scrapeEmails(String url) async {
    try {
      _logger.i('Starting web scraping for URL: $url');
      
      // Validate URL format
      final uri = _validateAndParseUrl(url);
      
      // Scrape the page with retry logic
      final content = await _fetchPageWithRetry(uri);
      
      // Parse HTML and extract emails
      final emails = _extractEmails(content, url);
      
      // Create contacts from extracted emails
      final contacts = _createContactsFromEmails(emails, url);
      
      // Validate extracted contacts
      final validationResult = _validateExtractedContacts(contacts);
      
      _logger.i('Web scraping completed: ${validationResult.validContacts.length} valid contacts extracted');
      
      return WebScrapingResult(
        sourceUrl: url,
        totalEmails: emails.length,
        validContacts: validationResult.validContacts,
        invalidContacts: validationResult.invalidContacts,
        duplicates: validationResult.duplicates,
        errors: validationResult.errors,
      );
      
    } catch (e) {
      _logger.e('Web scraping error for $url: $e');
      throw WebScrapingException('Failed to scrape emails from $url: $e');
    }
  }

  /// Validate and parse URL
  Uri _validateAndParseUrl(String url) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://$url';
      }
      
      final uri = Uri.parse(url);
      
      if (!uri.hasScheme || !uri.hasAuthority) {
        throw WebScrapingException('Invalid URL format: $url');
      }
      
      return uri;
    } catch (e) {
      throw WebScrapingException('Invalid URL: $e');
    }
  }

  /// Fetch page content with retry logic and exponential backoff
  Future<String> _fetchPageWithRetry(Uri uri) async {
    Exception? lastException;
    
    for (int attempt = 0; attempt < maxRetries; attempt++) {
      try {
        _logger.d('Attempt ${attempt + 1} for ${uri.toString()}');
        
        // Random delay to avoid rate limiting
        if (attempt > 0) {
          final delay = Duration(
            milliseconds: (baseDelay.inMilliseconds * pow(2, attempt - 1)).toInt() + 
                         Random().nextInt(1000)
          );
          _logger.d('Waiting ${delay.inMilliseconds}ms before retry');
          await Future.delayed(delay);
        }
        
        final content = await _fetchPage(uri);
        return content;
        
      } on NetworkException catch (e) {
        lastException = e;
        _logger.w('Network error on attempt ${attempt + 1}: ${e.message}');
        
        if (attempt == maxRetries - 1) {
          throw e;
        }
      } catch (e) {
        lastException = Exception('Unexpected error: $e');
        _logger.w('Unexpected error on attempt ${attempt + 1}: $e');
        
        if (attempt == maxRetries - 1) {
          throw WebScrapingException('Max retries exceeded: $e');
        }
      }
    }
    
    throw lastException ?? WebScrapingException('Failed to fetch page after $maxRetries attempts');
  }

  /// Fetch page content with anti-detection headers
  Future<String> _fetchPage(Uri uri) async {
    try {
      final client = http.Client();
      
      // Random user agent to avoid detection
      final userAgent = userAgents[Random().nextInt(userAgents.length)];
      
      final request = http.Request('GET', uri);
      
      // Anti-detection headers
      request.headers.addAll({
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      });
      
      // Add referer for internal pages
      if (uri.path.isNotEmpty && uri.path != '/') {
        request.headers['Referer'] = '${uri.scheme}://${uri.host}/';
      }
      
      _logger.d('Sending request to ${uri.toString()} with User-Agent: $userAgent');
      
      final streamedResponse = await client.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      
      client.close();
      
      if (response.statusCode == 200) {
        return response.body;
      } else if (response.statusCode == 429) {
        throw RateLimitException(
          'Rate limit exceeded for ${uri.host}',
          retryAfter: DateTime.now().add(const Duration(minutes: 5)),
        );
      } else if (response.statusCode >= 400 && response.statusCode < 500) {
        throw WebScrapingException('Client error ${response.statusCode}: ${response.reasonPhrase}');
      } else if (response.statusCode >= 500) {
        throw NetworkException('Server error ${response.statusCode}: ${response.reasonPhrase}');
      } else {
        throw NetworkException('Unexpected status code: ${response.statusCode}');
      }
      
    } on SocketException catch (e) {
      throw NetworkException('Connection failed: ${e.message}');
    } on HttpException catch (e) {
      throw NetworkException('HTTP error: ${e.message}');
    } catch (e) {
      if (e is AppException) rethrow;
      throw NetworkException('Network request failed: $e');
    }
  }

  /// Extract emails from HTML content using multiple patterns
  List<ExtractedEmail> _extractEmails(String content, String sourceUrl) {
    final emails = <ExtractedEmail>[];
    final seenEmails = <String>{};
    
    // Parse HTML
    final document = html_parser.parse(content);
    
    // Method 1: Extract from mailto links
    _extractFromMailtoLinks(document, emails, seenEmails, sourceUrl);
    
    // Method 2: Extract from text content using regex
    _extractFromTextContent(document, emails, seenEmails, sourceUrl);
    
    // Method 3: Extract from common contact selectors
    _extractFromContactSections(document, emails, seenEmails, sourceUrl);
    
    // Method 4: Extract from data attributes and hidden fields
    _extractFromDataAttributes(document, emails, seenEmails, sourceUrl);
    
    _logger.i('Extracted ${emails.length} unique emails from ${sourceUrl}');
    return emails;
  }

  /// Extract emails from mailto links
  void _extractFromMailtoLinks(Document document, List<ExtractedEmail> emails, 
                              Set<String> seenEmails, String sourceUrl) {
    final mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    
    for (final link in mailtoLinks) {
      final href = link.attributes['href'];
      if (href != null) {
        final email = href.replaceFirst('mailto:', '').split('?').first.trim();
        final name = link.text.trim();
        
        if (_isValidEmailFormat(email) && !seenEmails.contains(email.toLowerCase())) {
          seenEmails.add(email.toLowerCase());
          emails.add(ExtractedEmail(
            email: email,
            name: name.isNotEmpty && name != email ? name : null,
            context: 'mailto link',
            sourceUrl: sourceUrl,
          ));
        }
      }
    }
  }

  /// Extract emails from text content using regex patterns
  void _extractFromTextContent(Document document, List<ExtractedEmail> emails, 
                              Set<String> seenEmails, String sourceUrl) {
    final text = document.body?.text ?? '';
    
    // Multiple email regex patterns for better coverage
    final emailPatterns = [
      RegExp(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
      RegExp(r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b'),
      RegExp(r'\b[A-Za-z0-9._%+-]+\s*\[at\]\s*[A-Za-z0-9.-]+\s*\[dot\]\s*[A-Z|a-z]{2,}\b'),
    ];
    
    for (final pattern in emailPatterns) {
      final matches = pattern.allMatches(text);
      
      for (final match in matches) {
        String email = match.group(0)!.trim();
        
        // Clean up obfuscated emails
        email = email.replaceAll(RegExp(r'\s+'), '');
        email = email.replaceAll('[at]', '@');
        email = email.replaceAll('[dot]', '.');
        
        if (_isValidEmailFormat(email) && !seenEmails.contains(email.toLowerCase())) {
          seenEmails.add(email.toLowerCase());
          emails.add(ExtractedEmail(
            email: email,
            name: null,
            context: 'text content',
            sourceUrl: sourceUrl,
          ));
        }
      }
    }
  }

  /// Extract emails from common contact section selectors
  void _extractFromContactSections(Document document, List<ExtractedEmail> emails, 
                                  Set<String> seenEmails, String sourceUrl) {
    final contactSelectors = [
      '.contact',
      '.contact-info',
      '.contact-details',
      '#contact',
      '#contact-us',
      '.footer',
      '.team',
      '.staff',
      '.about',
      '.author',
      '.bio',
    ];
    
    for (final selector in contactSelectors) {
      final elements = document.querySelectorAll(selector);
      
      for (final element in elements) {
        final text = element.text;
        final emailRegex = RegExp(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b');
        final matches = emailRegex.allMatches(text);
        
        for (final match in matches) {
          final email = match.group(0)!.trim();
          
          if (_isValidEmailFormat(email) && !seenEmails.contains(email.toLowerCase())) {
            seenEmails.add(email.toLowerCase());
            
            // Try to find associated name
            String? name = _extractNameFromContext(element, email);
            
            emails.add(ExtractedEmail(
              email: email,
              name: name,
              context: 'contact section ($selector)',
              sourceUrl: sourceUrl,
            ));
          }
        }
      }
    }
  }

  /// Extract emails from data attributes and hidden fields
  void _extractFromDataAttributes(Document document, List<ExtractedEmail> emails, 
                                 Set<String> seenEmails, String sourceUrl) {
    // Check data attributes
    final elementsWithData = document.querySelectorAll('[data-email], [data-mail]');
    
    for (final element in elementsWithData) {
      final emailData = element.attributes['data-email'] ?? element.attributes['data-mail'];
      
      if (emailData != null && _isValidEmailFormat(emailData) && 
          !seenEmails.contains(emailData.toLowerCase())) {
        seenEmails.add(emailData.toLowerCase());
        
        final name = element.text.trim();
        emails.add(ExtractedEmail(
          email: emailData,
          name: name.isNotEmpty && name != emailData ? name : null,
          context: 'data attribute',
          sourceUrl: sourceUrl,
        ));
      }
    }
    
    // Check hidden input fields (sometimes used for contact forms)
    final hiddenInputs = document.querySelectorAll('input[type="hidden"]');
    
    for (final input in hiddenInputs) {
      final value = input.attributes['value'];
      
      if (value != null && _isValidEmailFormat(value) && 
          !seenEmails.contains(value.toLowerCase())) {
        seenEmails.add(value.toLowerCase());
        
        emails.add(ExtractedEmail(
          email: value,
          name: null,
          context: 'hidden input',
          sourceUrl: sourceUrl,
        ));
      }
    }
  }

  /// Try to extract name from context around email
  String? _extractNameFromContext(Element element, String email) {
    final text = element.text;
    final emailIndex = text.indexOf(email);
    
    if (emailIndex == -1) return null;
    
    // Look for name patterns before the email
    final beforeEmail = text.substring(0, emailIndex).trim();
    final afterEmail = text.substring(emailIndex + email.length).trim();
    
    // Common patterns: "Name: email", "Name - email", "Contact Name email"
    final namePatterns = [
      RegExp(r'([A-Za-z\s]+):?\s*$'),
      RegExp(r'([A-Za-z\s]+)\s*-\s*$'),
      RegExp(r'Contact:?\s*([A-Za-z\s]+)$'),
    ];
    
    for (final pattern in namePatterns) {
      final match = pattern.firstMatch(beforeEmail);
      if (match != null) {
        final name = match.group(1)?.trim();
        if (name != null && name.length > 1 && name.length < 50) {
          return name;
        }
      }
    }
    
    // Look for names after email in some cases
    if (afterEmail.startsWith('(') && afterEmail.contains(')')) {
      final nameMatch = RegExp(r'\(([^)]+)\)').firstMatch(afterEmail);
      if (nameMatch != null) {
        final name = nameMatch.group(1)?.trim();
        if (name != null && name.length > 1 && name.length < 50) {
          return name;
        }
      }
    }
    
    return null;
  }

  /// Validate email format
  bool _isValidEmailFormat(String email) {
    if (email.isEmpty || email.length > 320) return false; // RFC 5321 limit
    
    try {
      return EmailValidator.validate(email);
    } catch (e) {
      return false;
    }
  }

  /// Create ContactModel objects from extracted emails
  List<ContactModel> _createContactsFromEmails(List<ExtractedEmail> emails, String sourceUrl) {
    final contacts = <ContactModel>[];
    
    for (final extractedEmail in emails) {
      final name = extractedEmail.name ?? extractedEmail.email.split('@').first;
      
      final contact = ContactModel.fromWeb(
        name: name,
        email: extractedEmail.email,
        sourceUrl: sourceUrl,
        notes: 'Extracted from ${extractedEmail.context}',
      );
      
      contacts.add(contact);
    }
    
    return contacts;
  }

  /// Validate extracted contacts
  WebScrapingValidationResult _validateExtractedContacts(List<ContactModel> contacts) {
    final validContacts = <ContactModel>[];
    final invalidContacts = <ContactModel>[];
    final duplicates = <ContactModel>[];
    final errors = <String>[];
    final seenEmails = <String>{};
    
    for (final contact in contacts) {
      try {
        // Basic validation
        if (!contact.hasValidEmailFormat) {
          invalidContacts.add(contact.copyWith(isValidEmail: false));
          continue;
        }
        
        // Check for duplicates
        if (seenEmails.contains(contact.email.toLowerCase())) {
          duplicates.add(contact);
          continue;
        }
        
        // Additional validation
        if (_isCommonInvalidEmail(contact.email)) {
          invalidContacts.add(contact.copyWith(isValidEmail: false));
          continue;
        }
        
        seenEmails.add(contact.email.toLowerCase());
        validContacts.add(contact.copyWith(isValidEmail: true));
        
      } catch (e) {
        errors.add('Error validating contact ${contact.email}: $e');
        invalidContacts.add(contact.copyWith(isValidEmail: false));
      }
    }
    
    return WebScrapingValidationResult(
      validContacts: validContacts,
      invalidContacts: invalidContacts,
      duplicates: duplicates,
      errors: errors,
    );
  }

  /// Check for common invalid email patterns
  bool _isCommonInvalidEmail(String email) {
    final invalidPatterns = [
      'noreply@',
      'no-reply@',
      'donotreply@',
      'example@',
      'test@',
      'admin@localhost',
      'webmaster@localhost',
      'support@example.com',
    ];
    
    final emailLower = email.toLowerCase();
    
    for (final pattern in invalidPatterns) {
      if (emailLower.startsWith(pattern)) {
        return true;
      }
    }
    
    return false;
  }
}

/// Extracted email data structure
class ExtractedEmail {
  final String email;
  final String? name;
  final String context;
  final String sourceUrl;

  ExtractedEmail({
    required this.email,
    this.name,
    required this.context,
    required this.sourceUrl,
  });
}

/// Web scraping result
class WebScrapingResult {
  final String sourceUrl;
  final int totalEmails;
  final List<ContactModel> validContacts;
  final List<ContactModel> invalidContacts;
  final List<ContactModel> duplicates;
  final List<String> errors;

  WebScrapingResult({
    required this.sourceUrl,
    required this.totalEmails,
    required this.validContacts,
    required this.invalidContacts,
    required this.duplicates,
    required this.errors,
  });

  int get totalValidContacts => validContacts.length;
  int get totalInvalidContacts => invalidContacts.length;
  int get totalDuplicates => duplicates.length;
  bool get hasErrors => errors.isNotEmpty;
  
  double get successRate => totalEmails > 0 ? (totalValidContacts / totalEmails) * 100 : 0;
}

/// Web scraping validation result
class WebScrapingValidationResult {
  final List<ContactModel> validContacts;
  final List<ContactModel> invalidContacts;
  final List<ContactModel> duplicates;
  final List<String> errors;

  WebScrapingValidationResult({
    required this.validContacts,
    required this.invalidContacts,
    required this.duplicates,
    required this.errors,
  });
} 