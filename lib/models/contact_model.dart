import 'package:uuid/uuid.dart';

class ContactModel {
  final int? id;
  final String name;
  final String email;
  final String source; // 'csv' or 'web'
  final DateTime extractedDate;
  final int emailSentCount;
  final DateTime? lastEmailSent;
  final bool isValidEmail;
  final bool isActive;
  final bool consentGiven;
  final DateTime? consentTimestamp;
  final bool unsubscribed;
  final DateTime? unsubscribeTimestamp;
  final int bounceCount;
  final DateTime? lastBounceDate;
  final int spamComplaints;
  final String? tags;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  ContactModel({
    this.id,
    required this.name,
    required this.email,
    required this.source,
    DateTime? extractedDate,
    this.emailSentCount = 0,
    this.lastEmailSent,
    this.isValidEmail = true,
    this.isActive = true,
    this.consentGiven = false,
    this.consentTimestamp,
    this.unsubscribed = false,
    this.unsubscribeTimestamp,
    this.bounceCount = 0,
    this.lastBounceDate,
    this.spamComplaints = 0,
    this.tags,
    this.notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : extractedDate = extractedDate ?? DateTime.now(),
       createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  /// Factory constructor to create ContactModel from database map
  factory ContactModel.fromMap(Map<String, dynamic> map) {
    return ContactModel(
      id: map['id'] as int?,
      name: map['name'] as String,
      email: map['email'] as String,
      source: map['source'] as String,
      extractedDate: DateTime.parse(map['extracted_date'] as String),
      emailSentCount: map['email_sent_count'] as int? ?? 0,
      lastEmailSent: map['last_email_sent'] != null 
          ? DateTime.parse(map['last_email_sent'] as String)
          : null,
      isValidEmail: (map['is_valid_email'] as int? ?? 1) == 1,
      isActive: (map['is_active'] as int? ?? 1) == 1,
      consentGiven: (map['consent_given'] as int? ?? 0) == 1,
      consentTimestamp: map['consent_timestamp'] != null
          ? DateTime.parse(map['consent_timestamp'] as String)
          : null,
      unsubscribed: (map['unsubscribed'] as int? ?? 0) == 1,
      unsubscribeTimestamp: map['unsubscribe_timestamp'] != null
          ? DateTime.parse(map['unsubscribe_timestamp'] as String)
          : null,
      bounceCount: map['bounce_count'] as int? ?? 0,
      lastBounceDate: map['last_bounce_date'] != null
          ? DateTime.parse(map['last_bounce_date'] as String)
          : null,
      spamComplaints: map['spam_complaints'] as int? ?? 0,
      tags: map['tags'] as String?,
      notes: map['notes'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  /// Factory constructor for CSV import
  factory ContactModel.fromCsv({
    required String name,
    required String email,
    String? tags,
    String? notes,
  }) {
    return ContactModel(
      name: name.trim(),
      email: email.trim().toLowerCase(),
      source: 'csv',
      tags: tags?.trim(),
      notes: notes?.trim(),
    );
  }

  /// Factory constructor for web scraping
  factory ContactModel.fromWeb({
    required String name,
    required String email,
    required String sourceUrl,
    String? tags,
    String? notes,
  }) {
    return ContactModel(
      name: name.trim(),
      email: email.trim().toLowerCase(),
      source: 'web',
      tags: tags?.trim(),
      notes: notes?.trim() ?? 'Extracted from: $sourceUrl',
    );
  }

  /// Convert ContactModel to database map
  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'email': email,
      'source': source,
      'extracted_date': extractedDate.toIso8601String(),
      'email_sent_count': emailSentCount,
      'last_email_sent': lastEmailSent?.toIso8601String(),
      'is_valid_email': isValidEmail ? 1 : 0,
      'is_active': isActive ? 1 : 0,
      'consent_given': consentGiven ? 1 : 0,
      'consent_timestamp': consentTimestamp?.toIso8601String(),
      'unsubscribed': unsubscribed ? 1 : 0,
      'unsubscribe_timestamp': unsubscribeTimestamp?.toIso8601String(),
      'bounce_count': bounceCount,
      'last_bounce_date': lastBounceDate?.toIso8601String(),
      'spam_complaints': spamComplaints,
      'tags': tags,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Convert ContactModel to JSON for API operations
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'source': source,
      'extractedDate': extractedDate.toIso8601String(),
      'emailSentCount': emailSentCount,
      'lastEmailSent': lastEmailSent?.toIso8601String(),
      'isValidEmail': isValidEmail,
      'isActive': isActive,
      'consentGiven': consentGiven,
      'consentTimestamp': consentTimestamp?.toIso8601String(),
      'unsubscribed': unsubscribed,
      'unsubscribeTimestamp': unsubscribeTimestamp?.toIso8601String(),
      'bounceCount': bounceCount,
      'lastBounceDate': lastBounceDate?.toIso8601String(),
      'spamComplaints': spamComplaints,
      'tags': tags,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Create a copy of this contact with updated fields
  ContactModel copyWith({
    int? id,
    String? name,
    String? email,
    String? source,
    DateTime? extractedDate,
    int? emailSentCount,
    DateTime? lastEmailSent,
    bool? isValidEmail,
    bool? isActive,
    bool? consentGiven,
    DateTime? consentTimestamp,
    bool? unsubscribed,
    DateTime? unsubscribeTimestamp,
    int? bounceCount,
    DateTime? lastBounceDate,
    int? spamComplaints,
    String? tags,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ContactModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      source: source ?? this.source,
      extractedDate: extractedDate ?? this.extractedDate,
      emailSentCount: emailSentCount ?? this.emailSentCount,
      lastEmailSent: lastEmailSent ?? this.lastEmailSent,
      isValidEmail: isValidEmail ?? this.isValidEmail,
      isActive: isActive ?? this.isActive,
      consentGiven: consentGiven ?? this.consentGiven,
      consentTimestamp: consentTimestamp ?? this.consentTimestamp,
      unsubscribed: unsubscribed ?? this.unsubscribed,
      unsubscribeTimestamp: unsubscribeTimestamp ?? this.unsubscribeTimestamp,
      bounceCount: bounceCount ?? this.bounceCount,
      lastBounceDate: lastBounceDate ?? this.lastBounceDate,
      spamComplaints: spamComplaints ?? this.spamComplaints,
      tags: tags ?? this.tags,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  /// Mark email as sent
  ContactModel markEmailSent() {
    return copyWith(
      emailSentCount: emailSentCount + 1,
      lastEmailSent: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  /// Mark email as bounced
  ContactModel markBounced() {
    return copyWith(
      bounceCount: bounceCount + 1,
      lastBounceDate: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  /// Mark as spam complaint
  ContactModel markSpamComplaint() {
    return copyWith(
      spamComplaints: spamComplaints + 1,
      updatedAt: DateTime.now(),
    );
  }

  /// Give consent for email marketing
  ContactModel giveConsent() {
    return copyWith(
      consentGiven: true,
      consentTimestamp: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  /// Unsubscribe from email marketing
  ContactModel unsubscribe() {
    return copyWith(
      unsubscribed: true,
      unsubscribeTimestamp: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  /// Mark as inactive
  ContactModel deactivate() {
    return copyWith(
      isActive: false,
      updatedAt: DateTime.now(),
    );
  }

  /// Validate email format
  bool get hasValidEmailFormat {
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$');
    return emailRegex.hasMatch(email);
  }

  /// Check if contact can receive emails (GDPR compliant)
  bool get canReceiveEmails {
    return isActive && 
           !unsubscribed && 
           isValidEmail && 
           hasValidEmailFormat &&
           consentGiven;
  }

  /// Get reputation score based on bounces and complaints
  double get reputationScore {
    if (emailSentCount == 0) return 100.0;
    
    final bounceRate = (bounceCount / emailSentCount) * 100;
    final complaintRate = (spamComplaints / emailSentCount) * 100;
    
    // Start with 100 and deduct points for issues
    double score = 100.0;
    score -= bounceRate * 2; // Bounces are weighted 2x
    score -= complaintRate * 5; // Complaints are weighted 5x
    
    return score.clamp(0.0, 100.0);
  }

  /// Get engagement level
  String get engagementLevel {
    final score = reputationScore;
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 25) return 'Poor';
    return 'Very Poor';
  }

  /// Check if contact needs attention (high bounce/complaint rate)
  bool get needsAttention {
    return bounceCount >= 3 || spamComplaints >= 1 || reputationScore < 50;
  }

  /// Add tags to existing tags
  ContactModel addTags(List<String> newTags) {
    final existingTags = tags?.split(',').map((e) => e.trim()).toList() ?? [];
    final allTags = {...existingTags, ...newTags}.toList();
    return copyWith(
      tags: allTags.join(', '),
      updatedAt: DateTime.now(),
    );
  }

  /// Remove tags from existing tags
  ContactModel removeTags(List<String> tagsToRemove) {
    if (tags == null) return this;
    
    final existingTags = tags!.split(',').map((e) => e.trim()).toList();
    final filteredTags = existingTags.where((tag) => !tagsToRemove.contains(tag)).toList();
    
    return copyWith(
      tags: filteredTags.isEmpty ? null : filteredTags.join(', '),
      updatedAt: DateTime.now(),
    );
  }

  /// Get tags as list
  List<String> get tagsList {
    if (tags == null || tags!.isEmpty) return [];
    return tags!.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  }

  @override
  String toString() {
    return 'ContactModel(id: $id, name: $name, email: $email, source: $source, '
           'canReceiveEmails: $canReceiveEmails, reputationScore: ${reputationScore.toStringAsFixed(1)})';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ContactModel && other.email == email;
  }

  @override
  int get hashCode => email.hashCode;
}

/// Extension for contact lists
extension ContactListExtensions on List<ContactModel> {
  /// Filter contacts that can receive emails
  List<ContactModel> get eligibleForEmails {
    return where((contact) => contact.canReceiveEmails).toList();
  }

  /// Filter contacts by source
  List<ContactModel> bySource(String source) {
    return where((contact) => contact.source == source).toList();
  }

  /// Filter contacts by tags
  List<ContactModel> withTags(List<String> tags) {
    return where((contact) {
      final contactTags = contact.tagsList;
      return tags.any((tag) => contactTags.contains(tag));
    }).toList();
  }

  /// Get contacts needing attention
  List<ContactModel> get needingAttention {
    return where((contact) => contact.needsAttention).toList();
  }

  /// Group contacts by engagement level
  Map<String, List<ContactModel>> get groupedByEngagement {
    final Map<String, List<ContactModel>> groups = {};
    for (final contact in this) {
      final level = contact.engagementLevel;
      groups[level] ??= [];
      groups[level]!.add(contact);
    }
    return groups;
  }

  /// Get total emails sent
  int get totalEmailsSent {
    return fold(0, (total, contact) => total + contact.emailSentCount);
  }

  /// Get average reputation score
  double get averageReputationScore {
    if (isEmpty) return 0.0;
    return fold(0.0, (total, contact) => total + contact.reputationScore) / length;
  }
} 