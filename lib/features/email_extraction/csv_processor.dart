import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:csv/csv.dart';
import 'package:email_validator/email_validator.dart';
import 'package:logger/logger.dart';
import '../../core/errors/app_exceptions.dart';
import '../../models/contact_model.dart';

class CsvProcessor {
  final Logger _logger = Logger();
  
  // Supported encodings for detection
  static const List<Encoding> supportedEncodings = [
    utf8,
    latin1,
    ascii,
  ];

  // Common delimiters for detection
  static const List<String> commonDelimiters = [',', ';', '\t', '|'];

  /// Process CSV file with advanced validation and error handling
  Future<CsvProcessingResult> processCsvFile(File file) async {
    try {
      _logger.i('Starting CSV processing for file: ${file.path}');
      
      // Step 1: Validate file existence and size
      await _validateFile(file);
      
      // Step 2: Read file content
      final bytes = await file.readAsBytes();
      
      // Step 3: Detect encoding (Path C)
      final encoding = _detectEncoding(bytes);
      _logger.i('Detected encoding: ${encoding.name}');
      
      // Step 4: Convert to string
      final content = encoding.decode(bytes);
      
      // Step 5: Detect delimiter (Path A)
      final delimiter = _detectDelimiter(content);
      _logger.i('Detected delimiter: "$delimiter"');
      
      // Step 6: Parse CSV content
      final csvData = _parseCsvContent(content, delimiter);
      
      // Step 7: Dynamic header mapping (Path B)
      final headerMapping = _mapHeaders(csvData.first);
      _logger.i('Header mapping: $headerMapping');
      
      // Step 8: Process data rows
      final contacts = await _processDataRows(csvData.skip(1).toList(), headerMapping);
      
      // Step 9: Validate and filter contacts
      final validationResult = await _validateContacts(contacts);
      
      _logger.i('CSV processing completed: ${validationResult.validContacts.length} valid, ${validationResult.invalidContacts.length} invalid');
      
      return CsvProcessingResult(
        totalRows: csvData.length - 1,
        validContacts: validationResult.validContacts,
        invalidContacts: validationResult.invalidContacts,
        duplicates: validationResult.duplicates,
        errors: validationResult.errors,
        encoding: encoding.name,
        delimiter: delimiter,
        headerMapping: headerMapping,
      );
      
    } catch (e) {
      _logger.e('CSV processing error: $e');
      throw FileProcessingException('Failed to process CSV file: $e');
    }
  }

  /// Validate file before processing
  Future<void> _validateFile(File file) async {
    if (!await file.exists()) {
      throw FileProcessingException('File does not exist');
    }
    
    final stats = await file.stat();
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit
    
    if (stats.size > maxFileSize) {
      throw FileProcessingException('File too large. Maximum size is 50MB');
    }
    
    if (stats.size == 0) {
      throw FileProcessingException('File is empty');
    }
    
    // Check file extension
    final extension = file.path.toLowerCase().split('.').last;
    if (!['csv', 'txt'].contains(extension)) {
      throw FileProcessingException('Unsupported file format. Please use CSV files');
    }
  }

  /// Detect encoding using heuristics
  Encoding _detectEncoding(Uint8List bytes) {
    // Check for BOM markers
    if (bytes.length >= 3) {
      if (bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF) {
        return utf8; // UTF-8 BOM
      }
    }
    
    if (bytes.length >= 2) {
      if (bytes[0] == 0xFF && bytes[1] == 0xFE) {
        return utf8; // UTF-16 LE (fallback to UTF-8)
      }
      if (bytes[0] == 0xFE && bytes[1] == 0xFF) {
        return utf8; // UTF-16 BE (fallback to UTF-8)
      }
    }
    
    // Test each encoding
    for (final encoding in supportedEncodings) {
      try {
        final decoded = encoding.decode(bytes);
        // Check for invalid characters
        if (!decoded.contains('\uFFFD')) {
          return encoding;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback to UTF-8
    return utf8;
  }

  /// Detect delimiter by analyzing frequency
  String _detectDelimiter(String content) {
    final lines = content.split('\n').take(5).toList(); // Analyze first 5 lines
    final delimiterCounts = <String, int>{};
    
    for (final delimiter in commonDelimiters) {
      int totalCount = 0;
      List<int> countsPerLine = [];
      
      for (final line in lines) {
        if (line.trim().isEmpty) continue;
        final count = delimiter == '\t' 
            ? line.split('\t').length - 1
            : line.split(delimiter).length - 1;
        countsPerLine.add(count);
        totalCount += count;
      }
      
      // Check consistency across lines
      if (countsPerLine.isNotEmpty) {
        final avgCount = totalCount / countsPerLine.length;
        final variance = countsPerLine.map((c) => (c - avgCount) * (c - avgCount)).reduce((a, b) => a + b) / countsPerLine.length;
        
        // Lower variance means more consistent delimiter usage
        delimiterCounts[delimiter] = (totalCount * 1000 / (variance + 1)).round();
      }
    }
    
    if (delimiterCounts.isEmpty) {
      return ','; // Default fallback
    }
    
    // Return delimiter with highest consistency score
    return delimiterCounts.entries.reduce((a, b) => a.value > b.value ? a : b).key;
  }

  /// Parse CSV content with error handling
  List<List<String>> _parseCsvContent(String content, String delimiter) {
    try {
      final converter = CsvToListConverter(
        fieldDelimiter: delimiter,
        textDelimiter: '"',
        eol: '\n',
        shouldParseNumbers: false,
      );
      
      final data = converter.convert(content);
      
      // Convert all cells to strings and trim whitespace
      return data.map((row) => 
        row.map((cell) => cell?.toString().trim() ?? '').toList()
      ).toList();
      
    } catch (e) {
      _logger.e('CSV parsing error: $e');
      throw FileProcessingException('Invalid CSV format: $e');
    }
  }

  /// Dynamic header mapping with flexible column structures
  Map<String, int> _mapHeaders(List<String> headers) {
    final mapping = <String, int>{};
    
    // Normalize headers for matching
    final normalizedHeaders = headers.map((h) => h.toLowerCase().trim()).toList();
    
    // Email field mapping
    final emailPatterns = ['email', 'e-mail', 'email address', 'mail', 'electronic mail'];
    final emailIndex = _findHeaderIndex(normalizedHeaders, emailPatterns);
    if (emailIndex != -1) {
      mapping['email'] = emailIndex;
    }
    
    // Name field mapping
    final namePatterns = ['name', 'full name', 'fullname', 'contact name', 'person', 'contact'];
    final nameIndex = _findHeaderIndex(normalizedHeaders, namePatterns);
    if (nameIndex != -1) {
      mapping['name'] = nameIndex;
    } else {
      // Try to find first name and last name separately
      final firstNamePatterns = ['first name', 'firstname', 'fname', 'given name'];
      final lastNamePatterns = ['last name', 'lastname', 'lname', 'surname', 'family name'];
      
      final firstNameIndex = _findHeaderIndex(normalizedHeaders, firstNamePatterns);
      final lastNameIndex = _findHeaderIndex(normalizedHeaders, lastNamePatterns);
      
      if (firstNameIndex != -1) mapping['firstName'] = firstNameIndex;
      if (lastNameIndex != -1) mapping['lastName'] = lastNameIndex;
    }
    
    // Optional fields
    final phonePatterns = ['phone', 'telephone', 'mobile', 'cell', 'contact number'];
    final phoneIndex = _findHeaderIndex(normalizedHeaders, phonePatterns);
    if (phoneIndex != -1) {
      mapping['phone'] = phoneIndex;
    }
    
    final companyPatterns = ['company', 'organization', 'org', 'business', 'workplace'];
    final companyIndex = _findHeaderIndex(normalizedHeaders, companyPatterns);
    if (companyIndex != -1) {
      mapping['company'] = companyIndex;
    }
    
    final notesPatterns = ['notes', 'comments', 'description', 'remarks'];
    final notesIndex = _findHeaderIndex(normalizedHeaders, notesPatterns);
    if (notesIndex != -1) {
      mapping['notes'] = notesIndex;
    }
    
    final tagsPatterns = ['tags', 'categories', 'labels', 'groups'];
    final tagsIndex = _findHeaderIndex(normalizedHeaders, tagsPatterns);
    if (tagsIndex != -1) {
      mapping['tags'] = tagsIndex;
    }
    
    return mapping;
  }

  /// Find header index using pattern matching
  int _findHeaderIndex(List<String> headers, List<String> patterns) {
    for (int i = 0; i < headers.length; i++) {
      final header = headers[i];
      for (final pattern in patterns) {
        if (header.contains(pattern) || pattern.contains(header)) {
          return i;
        }
      }
    }
    return -1;
  }

  /// Process data rows into ContactModel objects
  Future<List<ContactModel>> _processDataRows(
    List<List<String>> rows, 
    Map<String, int> headerMapping
  ) async {
    final contacts = <ContactModel>[];
    
    for (int i = 0; i < rows.length; i++) {
      try {
        final row = rows[i];
        if (row.isEmpty || row.every((cell) => cell.isEmpty)) {
          continue; // Skip empty rows
        }
        
        final contact = _createContactFromRow(row, headerMapping);
        if (contact != null) {
          contacts.add(contact);
        }
      } catch (e) {
        _logger.w('Error processing row ${i + 2}: $e'); // +2 for header and 0-based index
      }
    }
    
    return contacts;
  }

  /// Create ContactModel from CSV row
  ContactModel? _createContactFromRow(List<String> row, Map<String, int> headerMapping) {
    try {
      // Extract email (required)
      final emailIndex = headerMapping['email'];
      if (emailIndex == null || emailIndex >= row.length) {
        return null; // Email is required
      }
      
      final email = row[emailIndex].trim();
      if (email.isEmpty) {
        return null;
      }
      
      // Extract name (required)
      String name = '';
      if (headerMapping.containsKey('name')) {
        final nameIndex = headerMapping['name']!;
        if (nameIndex < row.length) {
          name = row[nameIndex].trim();
        }
      } else {
        // Combine first and last name
        final firstName = headerMapping['firstName'] != null && headerMapping['firstName']! < row.length
            ? row[headerMapping['firstName']!].trim()
            : '';
        final lastName = headerMapping['lastName'] != null && headerMapping['lastName']! < row.length
            ? row[headerMapping['lastName']!].trim()
            : '';
        name = '$firstName $lastName'.trim();
      }
      
      if (name.isEmpty) {
        name = email.split('@').first; // Use email prefix as fallback
      }
      
      // Extract optional fields
      String? notes;
      if (headerMapping.containsKey('notes')) {
        final notesIndex = headerMapping['notes']!;
        if (notesIndex < row.length && row[notesIndex].isNotEmpty) {
          notes = row[notesIndex].trim();
        }
      }
      
      String? tags;
      if (headerMapping.containsKey('tags')) {
        final tagsIndex = headerMapping['tags']!;
        if (tagsIndex < row.length && row[tagsIndex].isNotEmpty) {
          tags = row[tagsIndex].trim();
        }
      }
      
      // Add company to notes if available
      if (headerMapping.containsKey('company')) {
        final companyIndex = headerMapping['company']!;
        if (companyIndex < row.length && row[companyIndex].isNotEmpty) {
          final company = row[companyIndex].trim();
          notes = notes != null ? '$notes\nCompany: $company' : 'Company: $company';
        }
      }
      
      return ContactModel.fromCsv(
        name: name,
        email: email,
        tags: tags,
        notes: notes,
      );
      
    } catch (e) {
      _logger.w('Error creating contact from row: $e');
      return null;
    }
  }

  /// Validate contacts with multi-layered email validation
  Future<ContactValidationResult> _validateContacts(List<ContactModel> contacts) async {
    final validContacts = <ContactModel>[];
    final invalidContacts = <InvalidContact>[];
    final duplicates = <ContactModel>[];
    final errors = <String>[];
    final seenEmails = <String>{};
    
    for (final contact in contacts) {
      try {
        final validationResult = _validateContact(contact);
        
        if (validationResult.isValid) {
          // Check for duplicates
          if (seenEmails.contains(contact.email.toLowerCase())) {
            duplicates.add(contact);
          } else {
            seenEmails.add(contact.email.toLowerCase());
            validContacts.add(contact.copyWith(isValidEmail: true));
          }
        } else {
          invalidContacts.add(InvalidContact(
            contact: contact.copyWith(isValidEmail: false),
            reasons: validationResult.errors,
          ));
        }
      } catch (e) {
        errors.add('Error validating contact ${contact.email}: $e');
      }
    }
    
    return ContactValidationResult(
      validContacts: validContacts,
      invalidContacts: invalidContacts,
      duplicates: duplicates,
      errors: errors,
    );
  }

  /// Multi-layered email validation
  IndividualContactValidation _validateContact(ContactModel contact) {
    final errors = <String>[];
    
    // Basic format validation
    if (!contact.hasValidEmailFormat) {
      errors.add('Invalid email format');
    }
    
    // Enhanced email validation using email_validator package
    if (!EmailValidator.validate(contact.email)) {
      errors.add('Email failed enhanced validation');
    }
    
    // Name validation
    if (contact.name.isEmpty) {
      errors.add('Name is required');
    } else if (contact.name.length < 2) {
      errors.add('Name too short');
    }
    
    // Additional email checks
    final emailParts = contact.email.split('@');
    if (emailParts.length == 2) {
      final domain = emailParts[1];
      
      // Check for common typos in domains
      if (_isCommonDomainTypo(domain)) {
        errors.add('Possible domain typo detected');
      }
      
      // Check for disposable email domains
      if (_isDisposableEmailDomain(domain)) {
        errors.add('Disposable email domain detected');
      }
    }
    
    return IndividualContactValidation(
      isValid: errors.isEmpty,
      errors: errors,
    );
  }

  /// Check for common domain typos
  bool _isCommonDomainTypo(String domain) {
    final commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    final domainLower = domain.toLowerCase();
    
    for (final correctDomain in commonDomains) {
      // Simple Levenshtein distance check for typos
      if (_levenshteinDistance(domainLower, correctDomain) == 1 && domainLower != correctDomain) {
        return true;
      }
    }
    
    return false;
  }

  /// Check for disposable email domains
  bool _isDisposableEmailDomain(String domain) {
    final disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'trashmail.com', 'temp-mail.org'
    ];
    
    return disposableDomains.contains(domain.toLowerCase());
  }

  /// Simple Levenshtein distance calculation
  int _levenshteinDistance(String s1, String s2) {
    if (s1.length < s2.length) return _levenshteinDistance(s2, s1);
    if (s2.isEmpty) return s1.length;

    List<int> previousRow = List.generate(s2.length + 1, (i) => i);

    for (int i = 0; i < s1.length; i++) {
      List<int> currentRow = [i + 1];
      
      for (int j = 0; j < s2.length; j++) {
        int insertions = previousRow[j + 1] + 1;
        int deletions = currentRow[j] + 1;
        int substitutions = previousRow[j] + (s1[i] != s2[j] ? 1 : 0);
        currentRow.add([insertions, deletions, substitutions].reduce((a, b) => a < b ? a : b));
      }
      
      previousRow = currentRow;
    }
    
    return previousRow.last;
  }
}

/// Result classes for CSV processing
class CsvProcessingResult {
  final int totalRows;
  final List<ContactModel> validContacts;
  final List<InvalidContact> invalidContacts;
  final List<ContactModel> duplicates;
  final List<String> errors;
  final String encoding;
  final String delimiter;
  final Map<String, int> headerMapping;

  CsvProcessingResult({
    required this.totalRows,
    required this.validContacts,
    required this.invalidContacts,
    required this.duplicates,
    required this.errors,
    required this.encoding,
    required this.delimiter,
    required this.headerMapping,
  });

  int get totalValidContacts => validContacts.length;
  int get totalInvalidContacts => invalidContacts.length;
  int get totalDuplicates => duplicates.length;
  bool get hasErrors => errors.isNotEmpty;
  
  double get successRate => totalRows > 0 ? (totalValidContacts / totalRows) * 100 : 0;
}

class ContactValidationResult {
  final List<ContactModel> validContacts;
  final List<InvalidContact> invalidContacts;
  final List<ContactModel> duplicates;
  final List<String> errors;

  ContactValidationResult({
    this.validContacts = const [],
    this.invalidContacts = const [],
    this.duplicates = const [],
    this.errors = const [],
  });
}

class InvalidContact {
  final ContactModel contact;
  final List<String> reasons;

  InvalidContact({
    required this.contact,
    required this.reasons,
  });
}

/// Simple validation result for individual contacts
class IndividualContactValidation {
  final bool isValid;
  final List<String> errors;

  IndividualContactValidation({
    required this.isValid,
    required this.errors,
  });
} 