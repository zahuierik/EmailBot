import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:logger/logger.dart';
import '../errors/app_exceptions.dart';
import '../../models/contact_model.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;
  final Logger _logger = Logger();

  // Database configuration
  static const String _databaseName = 'email_manager.db';
  static const int _databaseVersion = 1;

  // Table names
  static const String contactsTable = 'contacts';
  static const String emailCampaignsTable = 'email_campaigns';
  static const String emailLogsTable = 'email_logs';

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    try {
      final databasePath = await getDatabasesPath();
      final path = join(databasePath, _databaseName);

      _logger.i('Initializing database at: $path');

      return await openDatabase(
        path,
        version: _databaseVersion,
        onCreate: _onCreate,
        onUpgrade: _onUpgrade,
        onConfigure: _onConfigure,
      );
    } catch (e) {
      _logger.e('Database initialization error: $e');
      throw DatabaseException('Failed to initialize database: $e');
    }
  }

  Future<void> _onConfigure(Database db) async {
    // Enable foreign key constraints
    await db.execute('PRAGMA foreign_keys = ON');
    // Optimize performance
    await db.execute('PRAGMA synchronous = NORMAL');
    await db.execute('PRAGMA cache_size = 10000');
    await db.execute('PRAGMA temp_store = memory');
    await db.execute('PRAGMA journal_mode = WAL');
  }

  Future<void> _onCreate(Database db, int version) async {
    await _createTables(db);
    await _createIndexes(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    _logger.i('Upgrading database from version $oldVersion to $newVersion');
    // Handle database migrations here
    if (oldVersion < newVersion) {
      await _createTables(db);
      await _createIndexes(db);
    }
  }

  Future<void> _createTables(Database db) async {
    // Contacts table with enhanced schema
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $contactsTable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('csv', 'web')),
        extracted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        email_sent_count INTEGER DEFAULT 0,
        last_email_sent DATETIME,
        is_valid_email BOOLEAN DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        consent_given BOOLEAN DEFAULT 0,
        consent_timestamp DATETIME,
        unsubscribed BOOLEAN DEFAULT 0,
        unsubscribe_timestamp DATETIME,
        bounce_count INTEGER DEFAULT 0,
        last_bounce_date DATETIME,
        spam_complaints INTEGER DEFAULT 0,
        tags TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    ''');

    // Email campaigns table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $emailCampaignsTable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        sender_name TEXT,
        status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'paused', 'completed')),
        total_recipients INTEGER DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        emails_delivered INTEGER DEFAULT 0,
        emails_opened INTEGER DEFAULT 0,
        emails_clicked INTEGER DEFAULT 0,
        emails_bounced INTEGER DEFAULT 0,
        emails_complained INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_at DATETIME,
        completed_at DATETIME
      )
    ''');

    // Email logs table for tracking
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $emailLogsTable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        campaign_id INTEGER,
        email_address TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
        provider_response TEXT,
        provider_message_id TEXT,
        error_message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME,
        opened_at DATETIME,
        clicked_at DATETIME,
        bounced_at DATETIME,
        complained_at DATETIME,
        FOREIGN KEY (contact_id) REFERENCES $contactsTable (id) ON DELETE CASCADE,
        FOREIGN KEY (campaign_id) REFERENCES $emailCampaignsTable (id) ON DELETE SET NULL
      )
    ''');
  }

  Future<void> _createIndexes(Database db) async {
    // Performance optimization indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_email ON $contactsTable(email)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_source ON $contactsTable(source)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_last_email_sent ON $contactsTable(last_email_sent)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON $contactsTable(is_active)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribed ON $contactsTable(unsubscribed)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON $contactsTable(created_at)');
    
    await db.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON $emailLogsTable(contact_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON $emailLogsTable(campaign_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_status ON $emailLogsTable(status)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON $emailLogsTable(sent_at)');
    
    await db.execute('CREATE INDEX IF NOT EXISTS idx_campaigns_status ON $emailCampaignsTable(status)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON $emailCampaignsTable(created_at)');
  }

  // Contact CRUD operations with batch support
  Future<int> insertContact(ContactModel contact) async {
    try {
      final db = await database;
      return await db.insert(contactsTable, contact.toMap());
    } catch (e) {
      _logger.e('Error inserting contact: $e');
      throw DatabaseException('Failed to insert contact: $e');
    }
  }

  Future<void> insertContactsBatch(List<ContactModel> contacts) async {
    if (contacts.isEmpty) return;

    try {
      final db = await database;
      final batch = db.batch();

      for (final contact in contacts) {
        batch.insert(
          contactsTable,
          contact.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }

      await batch.commit(noResult: true);
      _logger.i('Batch inserted ${contacts.length} contacts');
    } catch (e) {
      _logger.e('Error in batch insert: $e');
      throw DatabaseException('Failed to batch insert contacts: $e');
    }
  }

  Future<List<ContactModel>> getAllContacts({
    int? limit,
    int? offset,
    String? whereClause,
    List<Object?>? whereArgs,
  }) async {
    try {
      final db = await database;
      final List<Map<String, dynamic>> maps = await db.query(
        contactsTable,
        where: whereClause,
        whereArgs: whereArgs,
        orderBy: 'created_at DESC',
        limit: limit,
        offset: offset,
      );

      return List.generate(maps.length, (i) => ContactModel.fromMap(maps[i]));
    } catch (e) {
      _logger.e('Error fetching contacts: $e');
      throw DatabaseException('Failed to fetch contacts: $e');
    }
  }

  Future<ContactModel?> getContactByEmail(String email) async {
    try {
      final db = await database;
      final List<Map<String, dynamic>> maps = await db.query(
        contactsTable,
        where: 'email = ?',
        whereArgs: [email],
        limit: 1,
      );

      if (maps.isNotEmpty) {
        return ContactModel.fromMap(maps.first);
      }
      return null;
    } catch (e) {
      _logger.e('Error fetching contact by email: $e');
      throw DatabaseException('Failed to fetch contact: $e');
    }
  }

  Future<int> updateContact(ContactModel contact) async {
    try {
      final db = await database;
      return await db.update(
        contactsTable,
        contact.toMap(),
        where: 'id = ?',
        whereArgs: [contact.id],
      );
    } catch (e) {
      _logger.e('Error updating contact: $e');
      throw DatabaseException('Failed to update contact: $e');
    }
  }

  Future<int> deleteContact(int id) async {
    try {
      final db = await database;
      return await db.delete(
        contactsTable,
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      _logger.e('Error deleting contact: $e');
      throw DatabaseException('Failed to delete contact: $e');
    }
  }

  // Analytics and reporting queries
  Future<Map<String, dynamic>> getContactStatistics() async {
    try {
      final db = await database;
      
      final totalContacts = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $contactsTable WHERE is_active = 1')
      ) ?? 0;

      final validEmails = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $contactsTable WHERE is_valid_email = 1 AND is_active = 1')
      ) ?? 0;

      final unsubscribed = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $contactsTable WHERE unsubscribed = 1')
      ) ?? 0;

      final emailsSentToday = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $emailLogsTable WHERE DATE(sent_at) = DATE(\'now\')')
      ) ?? 0;

      final bounceRate = await _calculateBounceRate();

      return {
        'totalContacts': totalContacts,
        'validEmails': validEmails,
        'unsubscribed': unsubscribed,
        'emailsSentToday': emailsSentToday,
        'bounceRate': bounceRate,
      };
    } catch (e) {
      _logger.e('Error fetching contact statistics: $e');
      throw DatabaseException('Failed to fetch statistics: $e');
    }
  }

  Future<double> _calculateBounceRate() async {
    try {
      final db = await database;
      
      final totalSent = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $emailLogsTable WHERE status IN (\'sent\', \'delivered\', \'bounced\')')
      ) ?? 0;

      final totalBounced = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM $emailLogsTable WHERE status = \'bounced\'')
      ) ?? 0;

      if (totalSent == 0) return 0.0;
      return (totalBounced / totalSent) * 100;
    } catch (e) {
      _logger.e('Error calculating bounce rate: $e');
      return 0.0;
    }
  }

  // Database maintenance
  Future<void> vacuum() async {
    try {
      final db = await database;
      await db.execute('VACUUM');
      _logger.i('Database vacuum completed');
    } catch (e) {
      _logger.e('Error during database vacuum: $e');
    }
  }

  Future<void> clearAllData() async {
    try {
      final db = await database;
      await db.delete(emailLogsTable);
      await db.delete(emailCampaignsTable);
      await db.delete(contactsTable);
      _logger.i('All data cleared from database');
    } catch (e) {
      _logger.e('Error clearing database: $e');
      throw DatabaseException('Failed to clear database: $e');
    }
  }

  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
} 