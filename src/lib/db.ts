import { Pool } from 'pg';
import { localQuery } from './db-local';

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Neon PostgreSQL SSL connections
  });
}

export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      };
    } catch (error) {
      console.error('PostgreSQL query error, falling back to local database:', error);
      return await localQuery(text, params);
    }
  }
  return await localQuery(text, params);
}

// Check database connection
export async function testDbConnection(): Promise<{ success: boolean; type: 'postgres' | 'local'; message: string }> {
  if (pool) {
    try {
      const client = await pool.connect();
      client.release();
      return { success: true, type: 'postgres', message: 'Connected to Neon PostgreSQL' };
    } catch (err: any) {
      return { success: false, type: 'postgres', message: `Failed to connect to PG: ${err.message}` };
    }
  }
  return { success: true, type: 'local', message: 'Running in Local Demo Mode (JSON files)' };
}

// Automatically create tables in Postgres if not exists
export async function initDbSchema(): Promise<void> {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. members
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                  TEXT NOT NULL,
        username              TEXT UNIQUE NOT NULL,
        password_hash         TEXT NOT NULL,
        role                  TEXT NOT NULL DEFAULT 'team',
        job_role              TEXT,
        assigned_courses      TEXT[],
        assigned_property     TEXT DEFAULT 'Both',
        status                TEXT DEFAULT 'Active',
        must_change_password  BOOLEAN DEFAULT TRUE,
        last_login            TIMESTAMP,
        last_login_ip         TEXT,
        created_at            TIMESTAMP DEFAULT NOW(),
        created_by            UUID,
        notes                 TEXT
      );
    `);

    // 2. websites
    await client.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code          TEXT UNIQUE NOT NULL,
        domain        TEXT NOT NULL,
        property_url  TEXT NOT NULL,
        status        TEXT DEFAULT 'Active',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed websites if empty
    const webs = await client.query('SELECT COUNT(*) FROM websites');
    if (parseInt(webs.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO websites (code, domain, property_url) VALUES
        ('TLI', 'techleadsit.com', 'https://www.techleadsit.com'),
        ('SOT', 'softonlinetraining.com', 'https://www.softonlinetraining.com');
      `);
    }

    // 3. courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_name   TEXT NOT NULL,
        keyword_group TEXT NOT NULL,
        property      TEXT DEFAULT 'Both',
        priority      TEXT DEFAULT 'Medium',
        status        TEXT DEFAULT 'Active',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed courses if empty
    const courseCount = await client.query('SELECT COUNT(*) FROM courses');
    if (parseInt(courseCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO courses (course_name, keyword_group, property, priority) VALUES
        ('Oracle Fusion Technical Training', 'Fusion Technical', 'Both', 'High'),
        ('Oracle Fusion SCM Training', 'Fusion SCM', 'Both', 'High'),
        ('Oracle Fusion HCM Training', 'Fusion HCM', 'Both', 'Medium'),
        ('Oracle Fusion Financials Training', 'Fusion Financials', 'Both', 'Medium');
      `);
    }

    // 4. keywords_master
    await client.query(`
      CREATE TABLE IF NOT EXISTS keywords_master (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keyword       TEXT NOT NULL,
        keyword_group TEXT NOT NULL,
        property      TEXT NOT NULL,
        target_url    TEXT,
        priority      TEXT DEFAULT 'Medium',
        status        TEXT DEFAULT 'Active',
        added_date    DATE DEFAULT CURRENT_DATE,
        notes         TEXT
      );
    `);

    // Seed keywords if empty
    const kwCount = await client.query('SELECT COUNT(*) FROM keywords_master');
    if (parseInt(kwCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO keywords_master (keyword, keyword_group, property, target_url, priority) VALUES
        ('Oracle Fusion Technical Training', 'Fusion Technical', 'TLI', 'https://www.techleadsit.com/oracle-fusion-technical-training', 'High'),
        ('Oracle Fusion SCM Training', 'Fusion SCM', 'TLI', 'https://www.techleadsit.com/oracle-fusion-scm-training', 'High'),
        ('Oracle Fusion HCM Online Course', 'Fusion HCM', 'TLI', 'https://www.techleadsit.com/oracle-fusion-hcm-training', 'Medium'),
        ('Oracle Fusion Financials Training', 'Fusion Financials', 'SOT', 'https://www.softonlinetraining.com/oracle-fusion-financials-training', 'Medium'),
        ('Best Oracle SCM Online Training', 'Fusion SCM', 'SOT', 'https://www.softonlinetraining.com/oracle-fusion-scm-training', 'High');
      `);
    }

    // 5. competitors
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitors (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain        TEXT UNIQUE NOT NULL,
        display_name  TEXT NOT NULL,
        threat_level  TEXT DEFAULT 'Medium',
        tracked_since DATE DEFAULT CURRENT_DATE,
        status        TEXT DEFAULT 'Active',
        notes         TEXT
      );
    `);

    // Seed competitors if empty
    const compCount = await client.query('SELECT COUNT(*) FROM competitors');
    if (parseInt(compCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO competitors (domain, display_name, threat_level) VALUES
        ('cloudshine.com', 'Cloudshine', 'High'),
        ('growmore.com', 'GrowMore Technologies', 'Medium'),
        ('erptree.com', 'Erptree Job Guarantee', 'Medium');
      `);
    }

    // 6. backlinks
    await client.query(`
      CREATE TABLE IF NOT EXISTS backlinks (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_date       DATE NOT NULL,
        member_id        UUID NOT NULL REFERENCES members(id),
        member_name      TEXT NOT NULL,
        property         TEXT NOT NULL,
        course           TEXT NOT NULL,
        location         TEXT,
        keyword_targeted TEXT,
        link_type        TEXT NOT NULL,
        url              TEXT NOT NULL,
        root_domain      TEXT NOT NULL,
        da               INTEGER,
        spam_score       INTEGER,
        status           TEXT DEFAULT 'Pending',
        notes            TEXT,
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indices for backlinks
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_member ON backlinks(member_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_date ON backlinks(entry_date DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_property ON backlinks(property);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_course ON backlinks(course);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_link_type ON backlinks(link_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_status ON backlinks(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_domain ON backlinks(root_domain);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_backlinks_date_mem ON backlinks(entry_date, member_id);`);

    // 7. backlinks_archive
    await client.query(`
      CREATE TABLE IF NOT EXISTS backlinks_archive (LIKE backlinks INCLUDING ALL);
    `);

    // 8. shared_domains
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared_domains (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain           TEXT UNIQUE NOT NULL,
        first_used_by    TEXT,
        first_used_date  DATE,
        last_used_date   DATE,
        total_uses       INTEGER DEFAULT 1,
        live_count       INTEGER DEFAULT 0,
        pending_count    INTEGER DEFAULT 0,
        rejected_count   INTEGER DEFAULT 0,
        live_rate        DECIMAL(5,2) DEFAULT 0,
        avg_da           DECIMAL(5,1) DEFAULT 0,
        avg_spam         DECIMAL(5,1) DEFAULT 0,
        best_link_type   TEXT,
        link_type_stats  JSONB DEFAULT '{}',
        status           TEXT DEFAULT 'Ok',
        admin_override   TEXT,
        admin_note       TEXT,
        updated_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_domains_live_rate ON shared_domains(live_rate DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_domains_da ON shared_domains(avg_da DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_domains_status ON shared_domains(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_domains_last_used ON shared_domains(last_used_date DESC);`);

    // 9. keyword_positions
    await client.query(`
      CREATE TABLE IF NOT EXISTS keyword_positions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        position_date DATE NOT NULL,
        keyword       TEXT NOT NULL,
        keyword_group TEXT NOT NULL,
        property      TEXT NOT NULL,
        clicks        INTEGER DEFAULT 0,
        impressions   INTEGER DEFAULT 0,
        ctr           DECIMAL(6,4),
        avg_position  DECIMAL(6,2),
        source        TEXT DEFAULT 'gsc',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_unique ON keyword_positions(position_date, keyword, property);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_positions_date ON keyword_positions(position_date DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_positions_keyword ON keyword_positions(keyword);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_positions_group ON keyword_positions(keyword_group);`);

    // 10. serp_daily
    await client.query(`
      CREATE TABLE IF NOT EXISTS serp_daily (
        id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        check_date             DATE NOT NULL,
        keyword                TEXT NOT NULL,
        tli_position           INTEGER,
        sot_position           INTEGER,
        pos1_domain            TEXT,
        pos2_domain            TEXT,
        pos3_domain            TEXT,
        pos4_domain            TEXT,
        pos5_domain            TEXT,
        has_featured_snippet   BOOLEAN DEFAULT FALSE,
        featured_snippet_domain TEXT,
        has_paa                BOOLEAN DEFAULT FALSE,
        has_local_pack         BOOLEAN DEFAULT FALSE,
        has_video              BOOLEAN DEFAULT FALSE,
        ad_count               INTEGER DEFAULT 0,
        api_key_used           INTEGER,
        created_at             TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_serp_unique ON serp_daily(check_date, keyword);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_serp_date ON serp_daily(check_date DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_serp_keyword ON serp_daily(keyword);`);

    // 11. alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at       TIMESTAMP DEFAULT NOW(),
        keyword          TEXT NOT NULL,
        keyword_group    TEXT NOT NULL,
        property         TEXT NOT NULL,
        alert_type       TEXT NOT NULL,
        severity         TEXT NOT NULL,
        assigned_to      TEXT,
        assigned_member_id UUID REFERENCES members(id),
        context          JSONB DEFAULT '{}',
        recommendation   JSONB DEFAULT '{}',
        status           TEXT DEFAULT 'active',
        acknowledged_at  TIMESTAMP,
        resolved_at      TIMESTAMP,
        resolved_by      TEXT
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_keyword ON alerts(keyword);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_assigned ON alerts(assigned_member_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);`);

    // 12. ml_patterns
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_patterns (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keyword_group        TEXT NOT NULL,
        property             TEXT NOT NULL,
        sample_size          INTEGER DEFAULT 0,
        confidence           INTEGER DEFAULT 0,
        avg_recovery_days    DECIMAL(5,1),
        best_link_types      JSONB DEFAULT '[]',
        optimal_weekly_count INTEGER,
        optimal_da_range     JSONB DEFAULT '{}',
        seasonal_factors     JSONB DEFAULT '{}',
        ctr_correlation      DECIMAL(4,3),
        domain_quality_impact JSONB DEFAULT '{}',
        algorithm_update_dates DATE[] DEFAULT '{}',
        last_updated         TIMESTAMP DEFAULT NOW(),
        notes                TEXT
      );
    `);

    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_unique ON ml_patterns(keyword_group, property);`);

    // 13. monthly_plans
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_plans (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_month    TEXT NOT NULL,
        plan_year     INTEGER NOT NULL,
        generated_at  TIMESTAMP DEFAULT NOW(),
        confidence    INTEGER,
        insights      TEXT[] DEFAULT '{}',
        member_plans  JSONB DEFAULT '{}',
        total_targets JSONB DEFAULT '{}',
        status        TEXT DEFAULT 'active',
        created_by    TEXT DEFAULT 'ml_engine'
      );
    `);

    // 14. work_log
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_log (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        log_date            DATE NOT NULL,
        member_id           UUID NOT NULL REFERENCES members(id),
        member_name         TEXT NOT NULL,
        course_worked_on    TEXT,
        free_notes          TEXT,
        websites_researched INTEGER DEFAULT 0,
        da_pa_checked       INTEGER DEFAULT 0,
        content_written     INTEGER DEFAULT 0,
        social_posts_shared INTEGER DEFAULT 0,
        quora_reddit_posts  INTEGER DEFAULT 0,
        hours_spent         DECIMAL(4,1),
        created_at          TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_worklog_date ON work_log(log_date DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_worklog_member ON work_log(member_id);`);

    // 15. api_usage_log
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage_log (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        log_date      DATE NOT NULL,
        api_type      TEXT NOT NULL,
        key_index     INTEGER,
        requests_made INTEGER DEFAULT 0,
        errors        INTEGER DEFAULT 0,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // 16. notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id     UUID NOT NULL REFERENCES members(id),
        type          TEXT NOT NULL,
        title         TEXT NOT NULL,
        message       TEXT NOT NULL,
        data          JSONB DEFAULT '{}',
        is_read       BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_notif_member ON notifications(member_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(member_id, is_read);`);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database schema in PostgreSQL:', error);
  } finally {
    client.release();
  }
}
