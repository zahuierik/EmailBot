import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/email_manager_provider.dart';
import '../widgets/stat_card.dart';
import '../widgets/processing_summary_card.dart';
import '../widgets/extraction_options_card.dart';
import '../widgets/quick_actions_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _urlController = TextEditingController();

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Email Manager Pro',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          Consumer<EmailManagerProvider>(
            builder: (context, provider, child) {
              return IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: provider.isLoading ? null : () => provider.refresh(),
                tooltip: 'Refresh Data',
              );
            },
          ),
        ],
      ),
      body: Consumer<EmailManagerProvider>(
        builder: (context, provider, child) {
          if (!provider.isInitialized && provider.isLoading) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Initializing Email Manager...'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.refresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Error display
                  if (provider.currentError != null)
                    Card(
                      color: Theme.of(context).colorScheme.errorContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error,
                              color: Theme.of(context).colorScheme.onErrorContainer,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                provider.currentError!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onErrorContainer,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: Icon(
                                Icons.close,
                                color: Theme.of(context).colorScheme.onErrorContainer,
                              ),
                              onPressed: () => provider._clearError(),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Welcome section
                  _buildWelcomeSection(context, provider),
                  const SizedBox(height: 24),

                  // Quick statistics
                  _buildQuickStats(context, provider),
                  const SizedBox(height: 24),

                  // Data extraction options
                  ExtractionOptionsCard(
                    onCsvImport: provider.isLoading ? null : () => _handleCsvImport(context, provider),
                    onWebScraping: provider.isLoading ? null : () => _handleWebScraping(context, provider),
                    urlController: _urlController,
                  ),
                  const SizedBox(height: 24),

                  // Quick actions
                  QuickActionsCard(provider: provider),
                  const SizedBox(height: 24),

                  // Processing summary
                  if (provider.lastProcessingSummary != null)
                    ProcessingSummaryCard(
                      summary: provider.lastProcessingSummary!,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context, EmailManagerProvider provider) {
    return Card(
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
                  if (provider.isEmailServiceConfigured)
                    _buildFeatureChip(context, Icons.verified, 'GDPR Compliant', isSuccess: true),
                ],
              ),
            ],
          ),
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

  Widget _buildQuickStats(BuildContext context, EmailManagerProvider provider) {
    final stats = provider.emailStatistics;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Statistics',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth > 600;
            
            if (isWide) {
              return Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Total Contacts',
                      value: stats?.totalContacts.toString() ?? '0',
                      icon: Icons.contacts,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Valid Emails',
                      value: stats?.validEmails.toString() ?? '0',
                      icon: Icons.mark_email_read,
                      color: Theme.of(context).colorScheme.tertiary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Emails Sent Today',
                      value: stats?.emailsSentToday.toString() ?? '0',
                      icon: Icons.send,
                      color: Theme.of(context).colorScheme.secondary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Daily Limit Remaining',
                      value: stats?.dailyLimitRemaining.toString() ?? '30',
                      icon: Icons.schedule,
                      color: Theme.of(context).colorScheme.outline,
                    ),
                  ),
                ],
              );
            } else {
              return Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Total Contacts',
                          value: stats?.totalContacts.toString() ?? '0',
                          icon: Icons.contacts,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: 'Valid Emails',
                          value: stats?.validEmails.toString() ?? '0',
                          icon: Icons.mark_email_read,
                          color: Theme.of(context).colorScheme.tertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Emails Sent Today',
                          value: stats?.emailsSentToday.toString() ?? '0',
                          icon: Icons.send,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: 'Daily Limit Remaining',
                          value: stats?.dailyLimitRemaining.toString() ?? '30',
                          icon: Icons.schedule,
                          color: Theme.of(context).colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ],
              );
            }
          },
        ),
      ],
    );
  }

  Future<void> _handleCsvImport(BuildContext context, EmailManagerProvider provider) async {
    try {
      await provider.processCsvFile();
      
      if (context.mounted && provider.lastProcessingSummary != null) {
        _showProcessingResult(context, provider.lastProcessingSummary!);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('CSV import failed: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _handleWebScraping(BuildContext context, EmailManagerProvider provider) async {
    final url = _urlController.text.trim();
    
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a URL')),
      );
      return;
    }

    try {
      await provider.processWebUrl(url);
      _urlController.clear();
      
      if (context.mounted && provider.lastProcessingSummary != null) {
        _showProcessingResult(context, provider.lastProcessingSummary!);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Web scraping failed: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _showProcessingResult(BuildContext context, ProcessingSummary summary) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              summary.validEmails > 0 ? Icons.check_circle : Icons.info,
              color: summary.validEmails > 0 
                  ? Theme.of(context).colorScheme.primary
                  : Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(width: 8),
            Text('${summary.source} Processing Complete'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildResultRow('Emails Extracted', summary.emailsExtracted.toString()),
            _buildResultRow('Valid Emails', summary.validEmails.toString()),
            _buildResultRow('Invalid Emails', summary.invalidEmails.toString()),
            _buildResultRow('Duplicates Found', summary.duplicatesFound.toString()),
            _buildResultRow('Success Rate', '${summary.successRate.toStringAsFixed(1)}%'),
            _buildResultRow('Processing Time', '${summary.totalProcessingTime.inSeconds}s'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Widget _buildResultRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
} 