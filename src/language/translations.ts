type Lang = 'en' | 'de';
type Translations = Record<string, string>;

const en: Translations = {
  // ── Layout / Nav ──────────────────────────────────────────────────────────
  nav_home:         'Home',
  nav_dashboard:    'Dashboard',
  nav_portfolio:    'Portfolio',
  nav_earnings:     'Earnings Reports',
  nav_analysis:     'Market Analysis',
  nav_debate:       'Market Debate',
  nav_token_usage:  'Token Usage',
  nav_settings:     'Settings',

  // ── Home ──────────────────────────────────────────────────────────────────
  home_badge:   'AI-Powered Stock Intelligence',
  home_tagline: 'Real-time earnings tracking, sentiment analysis, and autonomous agent monitoring — all in one premium interface.',

  card_dashboard_title:    'Live Dashboard',
  card_dashboard_subtitle: 'Watchlist · News · Agents',
  card_dashboard_desc:     'Real-time watchlist with sparklines, AI-generated daily news per stock with bullish/bearish sentiment analysis.',
  card_dashboard_stat1:    'Watching',
  card_dashboard_stat2:    'Agents',
  card_dashboard_stat3:    'Alerts',

  card_earnings_title:    'Earnings Reports',
  card_earnings_subtitle: 'Beat · Miss · Surprise',
  card_earnings_desc:     'Track EPS results vs analyst estimates across all covered tickers with real-time beat/miss indicators.',
  card_earnings_stat1:    'Covered',
  card_earnings_stat2:    'Beat Rate',
  card_earnings_stat3:    'Avg Surprise',

  card_analysis_title:    'Market Analysis',
  card_analysis_subtitle: 'Sentiment · Trends · Signals',
  card_analysis_desc:     'Bullish / bearish sentiment per ticker, trend indicators, and agent-generated market signals.',
  card_analysis_stat1:    'Tickers',
  card_analysis_stat2:    'Bullish',
  card_analysis_stat3:    'Signals',

  card_settings_title:    'Settings',
  card_settings_subtitle: 'Config · Files · Schedule',
  card_settings_desc:     'Control hub for agent configuration, cron jobs, file explorer, token usage and system soul editor.',
  card_settings_stat1:    'Cron Jobs',
  card_settings_stat2:    'Config Files',
  card_settings_stat3:    'Agents',

  // ── Market Debate ─────────────────────────────────────────────────────────
  debate_title:     'Market Debate',
  debate_subtitle:  'Autonomous analysis from four distinct perspectives',
  debate_bull:      'The Bull',
  debate_bear:      'The Bear',
  debate_macro:     'The Macro',
  debate_tech:      'The Technician',
  debate_last_updated: 'Last Debate Update:',

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dash_watchlist:           'Watchlist',
  dash_add_placeholder:     'Add ticker…',
  dash_daily_analysis:      'Daily Stock Analysis',
  dash_ai_agent:            'AI Agent',
  dash_news_summary:        'News Summary',
  dash_agent_analysis:      'Agent Analysis',
  dash_performance:         'Performance',
  dash_loading_chart:       'Loading chart…',
  dash_no_data:             'No data available',
  dash_last_updated:        'Last updated:',
  dash_pending_agent:       'pending agent run',
  dash_memory_files:        'Memory Files',
  dash_valuation:           'Intrinsic Value',
  dash_undervalued:         'Undervalued',
  dash_overvalued:          'Overvalued',
  dash_fair:                'Fair:',
  dash_current:             'Current',
  dash_bearish_range:       'Bearish Range',
  dash_bullish_projection:  'Bullish Projection',

  dcf_info_title:    'DCF Valuation Model',
  dcf_info_p1:       'The system calculates the value of a company based on its future cash flows:',
  dcf_info_step1:    'Phase 1 (Growth): Projects free cash flows for the next 10 years. Growth rate (based on analyst estimates) is used for the first 5 years, then gradually slows to a terminal rate (2.5%).',
  dcf_info_step2:    'Phase 2 (Terminal Value): Calculates the value of the business beyond the 10-year projection (Terminal Value).',
  dcf_info_step3:    'Discounting: All future sums are discounted to the present day using the "Cost of Equity" (CAPM with current Beta and risk-free rate).',
  dcf_info_step4:    'Net Debt: Cash is added and debt is subtracted to arrive at the equity value per share.',

  // ── Earnings Reports ──────────────────────────────────────────────────────
  earn_title:            'Earnings Reports',
  earn_subtitle:         'EPS beat/miss tracking with revenue comparison',
  earn_total:            'Total Reports',
  earn_beat:             'Beat',
  earn_missed:           'Missed',
  earn_beat_rate:        'Beat Rate',
  earn_avg_surprise:     'Avg EPS Surprise',
  earn_search:           'Search ticker or company…',
  earn_filter_all:       'All',
  earn_filter_beat:      'Beat',
  earn_filter_miss:      'Miss',
  earn_col_ticker:       'Ticker',
  earn_col_date:         'Date',
  earn_col_exp_eps:      'Expected EPS',
  earn_col_act_eps:      'Actual EPS',
  earn_col_surprise:     'Surprise',
  earn_col_result:       'Result',
  earn_col_revenue:      'Revenue',
  earn_detail_company:   'Company',
  earn_detail_eps:       'EPS Beat',
  earn_detail_rev:       'Revenue Beat',
  earn_detail_sector:    'Sector',
  earn_above:            'above',
  earn_below:            'below',
  earn_estimate:         'estimate',
  earn_no_results:       'No results found.',

  // ── Market Analysis ───────────────────────────────────────────────────────
  analysis_title:          'Market Analysis',
  analysis_subtitle:       'Agent-generated sentiment scores and signals per ticker',
  analysis_overview:       'Sentiment Overview',
  analysis_score_label:    'sentiment score',
  analysis_bull_pct:       '% bull',
  analysis_neutral_pct:    '% neutral',
  analysis_bear_pct:       '% bear',
  analysis_selected:       'Selected Ticker',
  analysis_signals:        'Agent Signals',
  analysis_breakdown:      'Sentiment Breakdown',
  analysis_bullish:        'Bullish',
  analysis_sl_bullish:     'Slightly Bullish',
  analysis_neutral:        'Neutral',
  analysis_sl_bearish:     'Slightly Bearish',
  analysis_bearish:        'Bearish',
  analysis_pct_bullish:    '% Bullish',
  analysis_pct_neutral:    '% Neutral',
  analysis_pct_bearish:    '% Bearish',

  // ── Settings – tab labels ─────────────────────────────────────────────────
  settings_tab_overview:   'Hub Overview',
  settings_tab_config:     'Config Files',
  settings_tab_cron:       'Cron Jobs',
  settings_tab_agents:     'Agents',
  settings_tab_soul:       'Soul',
  settings_tab_tokens:     'Token Usage',
  settings_tab_reporting:  'Explorer',
  settings_tab_logs:       'Agent Logs',

  // ── Settings – Overview ───────────────────────────────────────────────────
  settings_overview_title:    'Control Hub',
  settings_overview_subtitle: 'Manage agents, config, cron jobs, memory and files',
  settings_active_agents:     'Active Agents',
  settings_active_crons:      'Active Crons',
  settings_tokens_today:      'Tokens Today',
  settings_errors:            'Errors',
  settings_agent_status:      'Agent Status',

  // ── Settings – Config Files ───────────────────────────────────────────────
  settings_files:        'Files',
  settings_select_file:  'Select a file to view',

  // ── Settings – Cron Jobs ──────────────────────────────────────────────────
  settings_cron_title:   'Cron Jobs',
  settings_cron_active:  'active',
  settings_cron_total:   'total',
  settings_new_job:      'New Job',
  settings_last:         'Last:',
  settings_next:         'Next:',

  // ── Settings – Agents ─────────────────────────────────────────────────────
  settings_agents_title:    'Agents',
  settings_agents_running:  'running',
  settings_agents_errors:   'errors',
  settings_model:           'Model',
  settings_tokens_today_short: 'Tokens Today',
  settings_tasks_done:      'Tasks Done',
  settings_restart:         'Restart',

  // ── Settings – Soul ───────────────────────────────────────────────────────
  settings_soul_title:    'Agent Soul',
  settings_soul_subtitle: 'Core identity and behavior rules for all agents',
  settings_soul_save:     'Save Soul',
  settings_soul_saved:    'Saved!',

  // ── Settings – Token Usage ────────────────────────────────────────────────
  settings_tokens_title:      'Token Usage',
  settings_tokens_subtitle:   'Last 7 days across all agents',
  settings_tokens_total_in:   'Total Input',
  settings_tokens_total_out:  'Total Output',
  settings_tokens_total:      'Total',
  settings_daily_breakdown:   'Daily Breakdown',
  settings_by_agent:          'By Agent (today)',

  // ── Settings – Explorer ───────────────────────────────────────────────────
  settings_explorer_title:    'Explorer',
  settings_explorer_subtitle: 'Local file system explorer',
  settings_filter:            'Filter…',
  settings_loading:           'Loading…',
  settings_empty_folder:      'Empty folder',
  settings_items:             'items',
  settings_folders:           'folders',
  settings_files_count:       'files',

  // ── Settings – Agent Logs ─────────────────────────────────────────────────
  settings_logs_title:    'Agent Logs',
  settings_logs_subtitle: 'Live terminal output from all agents',


  // ── Common ────────────────────────────────────────────────────────────────
  save:    'Save',
  cancel:  'Cancel',
  edit:    'Edit',
  saved:   'Saved',
  total:   'total',
};

const de: Translations = {
  // ── Layout / Nav ──────────────────────────────────────────────────────────
  nav_home:         'Startseite',
  nav_dashboard:    'Dashboard',
  nav_portfolio:    'Portfolio',
  nav_earnings:     'Berichte',
  nav_analysis:     'Marktanalyse',
  nav_debate:       'Markt-Debatte',
  nav_token_usage:  'Token-Verbrauch',
  nav_settings:     'Einstellungen',

  // ── Home ──────────────────────────────────────────────────────────────────
  home_badge:   'KI-gestützte Aktienintelligenz',
  home_tagline: 'Echtzeit-Ergebnisverfolgung, Stimmungsanalyse und autonomes Agenten-Monitoring – alles in einer Premium-Oberfläche.',

  card_dashboard_title:    'Live Dashboard',
  card_dashboard_subtitle: 'Watchlist · News · Agenten',
  card_dashboard_desc:     'Echtzeit-Watchlist mit Sparklines, KI-generierte tägliche News pro Aktie mit bullischer/bärischer Stimmungsanalyse.',
  card_dashboard_stat1:    'Beobachtet',
  card_dashboard_stat2:    'Agenten',
  card_dashboard_stat3:    'Alarme',

  card_earnings_title:    'Berichte',
  card_earnings_subtitle: 'Beat · Miss · Überraschung',
  card_earnings_desc:     'EPS-Ergebnisse vs. Analystenschätzungen für alle beobachteten Titel mit Echtzeit-Beat/Miss-Indikatoren.',
  card_earnings_stat1:    'Abgedeckt',
  card_earnings_stat2:    'Beat-Rate',
  card_earnings_stat3:    'Ø Überraschung',

  card_analysis_title:    'Marktanalyse',
  card_analysis_subtitle: 'Stimmung · Trends · Signale',
  card_analysis_desc:     'Bullische/bärische Stimmung pro Ticker, Trendindikatoren und agentenbasierte Marktsignale.',
  card_analysis_stat1:    'Ticker',
  card_analysis_stat2:    'Bullisch',
  card_analysis_stat3:    'Signale',

  card_settings_title:    'Einstellungen',
  card_settings_subtitle: 'Konfig · Dateien · Zeitpläne',
  card_settings_desc:     'Kontrollzentrum für Agenten-Konfiguration, Cron-Jobs, Dateiexplorer, Token-Nutzung und System-Soul-Editor.',
  card_settings_stat1:    'Cron-Jobs',
  card_settings_stat2:    'Dateien',
  card_settings_stat3:    'Agenten',

  // ── Markt-Debatte ─────────────────────────────────────────────────────────
  debate_title:     'Markt-Debatte',
  debate_subtitle:  'Autonome Analyse aus vier verschiedenen Perspektiven',
  debate_bull:      'Der Bulle',
  debate_bear:      'Der Bär',
  debate_macro:     'Der Makro-Experte',
  debate_tech:      'Der Techniker',
  debate_last_updated: 'Letzte Aktualisierung der Debatte:',

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dash_watchlist:           'Watchlist',
  dash_add_placeholder:     'Ticker hinzufügen…',
  dash_daily_analysis:      'Tägliche Aktienanalyse',
  dash_ai_agent:            'KI-Agent',
  dash_news_summary:        'News-Zusammenfassung',
  dash_agent_analysis:      'Agenten-Analyse',
  dash_performance:         'Performance',
  dash_loading_chart:       'Chart wird geladen…',
  dash_no_data:             'Keine Daten verfügbar',
  dash_last_updated:        'Zuletzt aktualisiert:',
  dash_pending_agent:       'ausstehend',
  dash_memory_files:        'Speicherdateien',
  dash_valuation:           'Intrinsischer Wert',
  dash_undervalued:         'Unterbewertet',
  dash_overvalued:          'Überbewertet',
  dash_fair:                'Fairer Wert:',
  dash_current:             'Aktuell',
  dash_bearish_range:       'Bärischer Bereich',
  dash_bullish_projection:  'Bullische Prognose',

  dcf_info_title:    'DCF-Bewertungsmodell',
  dcf_info_p1:       'Das System berechnet den Wert eines Unternehmens basierend auf seinen zukünftigen Cashflows:',
  dcf_info_step1:    'Phase 1 (Wachstum): Prognostiziert die freien Cashflows der nächsten 10 Jahre. Wachstumsrate (Analystenschätzungen) für die ersten 5 Jahre, danach langsame Annäherung an Endwert (2,5%).',
  dcf_info_step2:    'Phase 2 (Endwert): Berechnet den Wert des Unternehmens nach diesen 10 Jahren (Terminal Value).',
  dcf_info_step3:    'Abzinsung: Alle zukünftigen Summen werden mit den "Kapitalkosten" (CAPM mit aktuellem Beta und risikolosem Zins) abgezinst.',
  dcf_info_step4:    'Netto-Schulden: Cash wird addiert und Schulden abgezogen, um den Eigenkapitalwert pro Aktie zu erhalten.',

  // ── Earnings Reports ──────────────────────────────────────────────────────
  earn_title:            'Quartalsergebnisse',
  earn_subtitle:         'EPS Beat/Miss-Verfolgung mit Umsatzvergleich',
  earn_total:            'Gesamt',
  earn_beat:             'Beat',
  earn_missed:           'Verfehlt',
  earn_beat_rate:        'Beat-Rate',
  earn_avg_surprise:     'Ø EPS-Überraschung',
  earn_search:           'Ticker oder Unternehmen suchen…',
  earn_filter_all:       'Alle',
  earn_filter_beat:      'Beat',
  earn_filter_miss:      'Miss',
  earn_col_ticker:       'Ticker',
  earn_col_date:         'Datum',
  earn_col_exp_eps:      'Erwarteter EPS',
  earn_col_act_eps:      'Tatsächlicher EPS',
  earn_col_surprise:     'Überraschung',
  earn_col_result:       'Ergebnis',
  earn_col_revenue:      'Umsatz',
  earn_detail_company:   'Unternehmen',
  earn_detail_eps:       'EPS Beat',
  earn_detail_rev:       'Umsatz Beat',
  earn_detail_sector:    'Sektor',
  earn_above:            'über',
  earn_below:            'unter',
  earn_estimate:         'Schätzung',
  earn_no_results:       'Keine Ergebnisse gefunden.',

  // ── Market Analysis ───────────────────────────────────────────────────────
  analysis_title:          'Marktanalyse',
  analysis_subtitle:       'Agentenbasierte Stimmungswerte und Signale pro Ticker',
  analysis_overview:       'Stimmungsübersicht',
  analysis_score_label:    'Stimmungswert',
  analysis_bull_pct:       '% Bull',
  analysis_neutral_pct:    '% Neutral',
  analysis_bear_pct:       '% Bär',
  analysis_selected:       'Ausgewählter Ticker',
  analysis_signals:        'Agentensignale',
  analysis_breakdown:      'Stimmungsaufschlüsselung',
  analysis_bullish:        'Bullisch',
  analysis_sl_bullish:     'Leicht bullisch',
  analysis_neutral:        'Neutral',
  analysis_sl_bearish:     'Leicht bärisch',
  analysis_bearish:        'Bärisch',
  analysis_pct_bullish:    '% Bullisch',
  analysis_pct_neutral:    '% Neutral',
  analysis_pct_bearish:    '% Bärisch',

  // ── Settings – tab labels ─────────────────────────────────────────────────
  settings_tab_overview:   'Übersicht',
  settings_tab_config:     'Konfigdateien',
  settings_tab_cron:       'Cron-Jobs',
  settings_tab_agents:     'Agenten',
  settings_tab_soul:       'Soul',
  settings_tab_tokens:     'Token-Verbrauch',
  settings_tab_reporting:  'Explorer',
  settings_tab_logs:       'Agenten-Logs',

  // ── Settings – Overview ───────────────────────────────────────────────────
  settings_overview_title:    'Kontrollzentrum',
  settings_overview_subtitle: 'Agenten, Konfiguration, Cron-Jobs, Speicher und Dateien verwalten',
  settings_active_agents:     'Aktive Agenten',
  settings_active_crons:      'Aktive Crons',
  settings_tokens_today:      'Heutige Tokens',
  settings_errors:            'Fehler',
  settings_agent_status:      'Agentenstatus',

  // ── Settings – Config Files ───────────────────────────────────────────────
  settings_files:        'Dateien',
  settings_select_file:  'Datei zum Anzeigen auswählen',

  // ── Settings – Cron Jobs ──────────────────────────────────────────────────
  settings_cron_title:   'Cron-Jobs',
  settings_cron_active:  'aktiv',
  settings_cron_total:   'gesamt',
  settings_new_job:      'Neuer Job',
  settings_last:         'Zuletzt:',
  settings_next:         'Nächste:',

  // ── Settings – Agents ─────────────────────────────────────────────────────
  settings_agents_title:       'Agenten',
  settings_agents_running:     'laufend',
  settings_agents_errors:      'Fehler',
  settings_model:              'Modell',
  settings_tokens_today_short: 'Heutige Tokens',
  settings_tasks_done:         'Aufgaben erledigt',
  settings_restart:            'Neustart',

  // ── Settings – Soul ───────────────────────────────────────────────────────
  settings_soul_title:    'Agenten-Soul',
  settings_soul_subtitle: 'Kernidentität und Verhaltensregeln für alle Agenten',
  settings_soul_save:     'Soul speichern',
  settings_soul_saved:    'Gespeichert!',

  // ── Settings – Token Usage ────────────────────────────────────────────────
  settings_tokens_title:      'Token-Verbrauch',
  settings_tokens_subtitle:   'Letzte 7 Tage über alle Agenten',
  settings_tokens_total_in:   'Eingabe gesamt',
  settings_tokens_total_out:  'Ausgabe gesamt',
  settings_tokens_total:      'Gesamt',
  settings_daily_breakdown:   'Tägliche Aufschlüsselung',
  settings_by_agent:          'Nach Agent (heute)',

  // ── Settings – Explorer ───────────────────────────────────────────────────
  settings_explorer_title:    'Explorer',
  settings_explorer_subtitle: 'Lokaler Dateisystem-Explorer',
  settings_filter:            'Filtern…',
  settings_loading:           'Lädt…',
  settings_empty_folder:      'Leerer Ordner',
  settings_items:             'Einträge',
  settings_folders:           'Ordner',
  settings_files_count:       'Dateien',

  // ── Settings – Agent Logs ─────────────────────────────────────────────────
  settings_logs_title:    'Agenten-Logs',
  settings_logs_subtitle: 'Live-Terminal-Ausgabe aller Agenten',


  // ── Common ────────────────────────────────────────────────────────────────
  save:    'Speichern',
  cancel:  'Abbrechen',
  edit:    'Bearbeiten',
  saved:   'Gespeichert',
  total:   'gesamt',
};

export const translations: Record<Lang, Translations> = { en, de };
export type { Lang };
