import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(const EmailManagerApp());
}

class EmailManagerApp extends StatelessWidget {
  const EmailManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => EmailManagerProvider(),
      child: MaterialApp(
        title: 'Email Manager Pro',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2563EB), // Professional blue
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            scrolledUnderElevation: 4,
          ),
          cardTheme: const CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        home: const MainNavigationScreen(),
      ),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = [
    const HomeScreen(),
    const ContactsScreen(),
    const AnalyticsScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.contacts_outlined),
            selectedIcon: Icon(Icons.contacts),
            label: 'Contacts',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Analytics',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
        elevation: 8,
      ),
    );
  }
}

// Simple provider for state management
class EmailManagerProvider extends ChangeNotifier {
  int _totalContacts = 0;
  int _validEmails = 0;
  int _emailsSentToday = 0;
  
  int get totalContacts => _totalContacts;
  int get validEmails => _validEmails;
  int get emailsSentToday => _emailsSentToday;
  
  void addContacts(int count) {
    _totalContacts += count;
    _validEmails += count;
    notifyListeners();
  }
  
  void simulateEmailSent() {
    _emailsSentToday++;
    notifyListeners();
  }
}

// Home Screen
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _urlController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Email Manager Pro',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Card(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primaryContainer.withOpacity(0.7),
                      Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.7),
                    ],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.email,
                              color: Theme.of(context).colorScheme.onPrimary,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome to Email Manager Pro',
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Advanced email extraction and management system',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildFeatureChip(context, Icons.file_upload, 'CSV Import'),
                          _buildFeatureChip(context, Icons.web, 'Web Scraping'),
                          _buildFeatureChip(context, Icons.email_outlined, 'Email Sending'),
                          _buildFeatureChip(context, Icons.analytics, 'Analytics'),
                          _buildFeatureChip(context, Icons.verified, 'GDPR Compliant', isSuccess: true),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Quick Statistics
            Text(
              'Quick Statistics',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Consumer<EmailManagerProvider>(
              builder: (context, provider, child) {
                return Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        context, 
                        'Total Contacts', 
                        provider.totalContacts.toString(), 
                        Icons.contacts,
                        Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context, 
                        'Valid Emails', 
                        provider.validEmails.toString(), 
                        Icons.mark_email_read,
                        Theme.of(context).colorScheme.tertiary,
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 12),
            Consumer<EmailManagerProvider>(
              builder: (context, provider, child) {
                return Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        context, 
                        'Emails Sent Today', 
                        provider.emailsSentToday.toString(), 
                        Icons.send,
                        Theme.of(context).colorScheme.secondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context, 
                        'Daily Limit Remaining', 
                        '${30 - provider.emailsSentToday}', 
                        Icons.schedule,
                        Theme.of(context).colorScheme.outline,
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),

            // Data Extraction Options
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Data Extraction',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showImportDemo(context),
                            icon: const Icon(Icons.file_upload),
                            label: const Text('Import CSV File'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showScrapingDemo(context),
                            icon: const Icon(Icons.web),
                            label: const Text('Web Scraping'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'Website URL',
                        hintText: 'Enter URL to scrape emails from...',
                        prefixIcon: Icon(Icons.link),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Quick Actions
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Actions',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Consumer<EmailManagerProvider>(
                      builder: (context, provider, child) {
                        return Column(
                          children: [
                            ListTile(
                              leading: const Icon(Icons.send),
                              title: const Text('Send Test Email'),
                              subtitle: const Text('Send a test email to verify configuration'),
                              trailing: const Icon(Icons.arrow_forward_ios),
                              onTap: () {
                                provider.simulateEmailSent();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Test email sent!')),
                                );
                              },
                            ),
                            const Divider(),
                            ListTile(
                              leading: const Icon(Icons.settings),
                              title: const Text('Email Configuration'),
                              subtitle: const Text('Configure SendGrid API settings'),
                              trailing: const Icon(Icons.arrow_forward_ios),
                              onTap: () => _showConfigDemo(context),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureChip(BuildContext context, IconData icon, String label, {bool isSuccess = false}) {
    return Chip(
      avatar: Icon(
        icon,
        size: 16,
        color: isSuccess 
            ? Theme.of(context).colorScheme.onSecondaryContainer
            : Theme.of(context).colorScheme.onSurfaceVariant,
      ),
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: isSuccess 
              ? Theme.of(context).colorScheme.onSecondaryContainer
              : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
      backgroundColor: isSuccess 
          ? Theme.of(context).colorScheme.secondaryContainer
          : Theme.of(context).colorScheme.surfaceVariant,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImportDemo(BuildContext context) {
    context.read<EmailManagerProvider>().addContacts(25);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('CSV Import Demo'),
        content: const Text('Demo: Imported 25 contacts from CSV file!\n\nIn the full version, this would:\n• Parse CSV files\n• Validate email addresses\n• Store in SQLite database\n• Show detailed import results'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showScrapingDemo(BuildContext context) {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a URL first')),
      );
      return;
    }
    
    context.read<EmailManagerProvider>().addContacts(8);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Web Scraping Demo'),
        content: Text('Demo: Found 8 email addresses on $url!\n\nIn the full version, this would:\n• Scrape emails from web pages\n• Use anti-detection techniques\n• Extract contact names\n• Validate email formats'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showConfigDemo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Email Configuration'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const TextField(
              decoration: InputDecoration(
                labelText: 'SendGrid API Key',
                hintText: 'SG.xxxxxxxxxxxx',
              ),
            ),
            const SizedBox(height: 16),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Sender Email',
                hintText: 'your@email.com',
              ),
            ),
            const SizedBox(height: 16),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Sender Name',
                hintText: 'Your Name',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Configuration saved!')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

// Placeholder screens
class ContactsScreen extends StatelessWidget {
  const ContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contacts')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.contacts, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Contacts will be displayed here'),
            Text('Import CSV or scrape web to add contacts'),
          ],
        ),
      ),
    );
  }
}

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.analytics, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Email analytics and reports'),
            Text('Track delivery rates, opens, and bounces'),
          ],
        ),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.settings, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Application settings'),
            Text('Configure email, database, and GDPR settings'),
          ],
        ),
      ),
    );
  }
} 