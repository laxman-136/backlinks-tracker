import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'db-local');

// Ensure database directory and initial seeds exist
export function initLocalDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 1. members.json
  const membersPath = path.join(DB_DIR, 'members.json');
  if (!fs.existsSync(membersPath)) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const teamHash = bcrypt.hashSync('lakshmi123', 10);
    const initialMembers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'SEO Manager (Admin)',
        username: 'admin',
        password_hash: adminHash,
        role: 'admin',
        job_role: 'Manager',
        assigned_courses: [],
        assigned_property: 'Both',
        status: 'Active',
        must_change_password: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Lakshmi',
        username: 'lakshmi',
        password_hash: teamHash,
        role: 'team',
        job_role: 'Senior SEO',
        assigned_courses: ['Oracle Fusion Technical Training', 'Oracle Fusion SCM Training'],
        assigned_property: 'Both',
        status: 'Active',
        must_change_password: false,
        created_at: new Date().toISOString(),
      }
    ];
    fs.writeFileSync(membersPath, JSON.stringify(initialMembers, null, 2), 'utf8');
  }

  // 2. websites.json
  const websitesPath = path.join(DB_DIR, 'websites.json');
  if (!fs.existsSync(websitesPath)) {
    const initialWebsites = [
      { id: 'w1', code: 'TLI', domain: 'techleadsit.com', property_url: 'https://www.techleadsit.com', status: 'Active', created_at: new Date().toISOString() },
      { id: 'w2', code: 'SOT', domain: 'softonlinetraining.com', property_url: 'https://www.softonlinetraining.com', status: 'Active', created_at: new Date().toISOString() }
    ];
    fs.writeFileSync(websitesPath, JSON.stringify(initialWebsites, null, 2), 'utf8');
  }

  // 3. competitors.json
  const competitorsPath = path.join(DB_DIR, 'competitors.json');
  if (!fs.existsSync(competitorsPath)) {
    const initialCompetitors = [
      { id: 'c1', domain: 'cloudshine.com', display_name: 'Cloudshine', threat_level: 'High', tracked_since: new Date().toISOString().split('T')[0], status: 'Active', notes: '' },
      { id: 'c2', domain: 'growmore.com', display_name: 'GrowMore Technologies', threat_level: 'Medium', tracked_since: new Date().toISOString().split('T')[0], status: 'Active', notes: '' },
      { id: 'c3', domain: 'erptree.com', display_name: 'Erptree Job Guarantee', threat_level: 'Medium', tracked_since: new Date().toISOString().split('T')[0], status: 'Active', notes: '' }
    ];
    fs.writeFileSync(competitorsPath, JSON.stringify(initialCompetitors, null, 2), 'utf8');
  }

  // 4. courses.json
  const coursesPath = path.join(DB_DIR, 'courses.json');
  if (!fs.existsSync(coursesPath)) {
    const initialCourses = [
      { id: 'co1', course_name: 'Oracle Fusion Technical Training', keyword_group: 'Fusion Technical', property: 'Both', priority: 'High', status: 'Active', created_at: new Date().toISOString() },
      { id: 'co2', course_name: 'Oracle Fusion SCM Training', keyword_group: 'Fusion SCM', property: 'Both', priority: 'High', status: 'Active', created_at: new Date().toISOString() },
      { id: 'co3', course_name: 'Oracle Fusion HCM Training', keyword_group: 'Fusion HCM', property: 'Both', priority: 'Medium', status: 'Active', created_at: new Date().toISOString() },
      { id: 'co4', course_name: 'Oracle Fusion Financials Training', keyword_group: 'Fusion Financials', property: 'Both', priority: 'Medium', status: 'Active', created_at: new Date().toISOString() }
    ];
    fs.writeFileSync(coursesPath, JSON.stringify(initialCourses, null, 2), 'utf8');
  }

  // 5. keywords_master.json
  const keywordsPath = path.join(DB_DIR, 'keywords_master.json');
  if (!fs.existsSync(keywordsPath)) {
    const initialKeywords = [
      { id: 'k1', keyword: 'Oracle Fusion Technical Training', keyword_group: 'Fusion Technical', property: 'TLI', target_url: 'https://www.techleadsit.com/oracle-fusion-technical-training', priority: 'High', status: 'Active', added_date: new Date().toISOString().split('T')[0] },
      { id: 'k2', keyword: 'Oracle Fusion SCM Training', keyword_group: 'Fusion SCM', property: 'TLI', target_url: 'https://www.techleadsit.com/oracle-fusion-scm-training', priority: 'High', status: 'Active', added_date: new Date().toISOString().split('T')[0] },
      { id: 'k3', keyword: 'Oracle Fusion HCM Online Course', keyword_group: 'Fusion HCM', property: 'TLI', target_url: 'https://www.techleadsit.com/oracle-fusion-hcm-training', priority: 'Medium', status: 'Active', added_date: new Date().toISOString().split('T')[0] },
      { id: 'k4', keyword: 'Oracle Fusion Financials Training', keyword_group: 'Fusion Financials', property: 'SOT', target_url: 'https://www.softonlinetraining.com/oracle-fusion-financials-training', priority: 'Medium', status: 'Active', added_date: new Date().toISOString().split('T')[0] },
      { id: 'k5', keyword: 'Best Oracle SCM Online Training', keyword_group: 'Fusion SCM', property: 'SOT', target_url: 'https://www.softonlinetraining.com/oracle-fusion-scm-training', priority: 'High', status: 'Active', added_date: new Date().toISOString().split('T')[0] }
    ];
    fs.writeFileSync(keywordsPath, JSON.stringify(initialKeywords, null, 2), 'utf8');
  }

  // Initialize remaining files as empty arrays
  const emptyFiles = [
    'backlinks', 'shared_domains', 'keyword_positions', 'serp_daily',
    'alerts', 'ml_patterns', 'monthly_plans', 'work_log', 'api_usage_log', 'notifications'
  ];
  for (const file of emptyFiles) {
    const filePath = path.join(DB_DIR, `${file}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
    }
  }
}

// Read/write JSON files helpers
function readTable(tableName: string): any[] {
  const filePath = path.join(DB_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeTable(tableName: string, data: any[]): void {
  const filePath = path.join(DB_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Generate new standard UUID for local DB
function localUuid(): string {
  return 'local-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
}

// Helper to check standard matches
function matchFilter(row: any, field: string, operator: string, val: any): boolean {
  const rowVal = row[field];
  if (operator === '=') {
    return String(rowVal).toLowerCase() === String(val).toLowerCase();
  }
  if (operator === '!=') {
    return String(rowVal).toLowerCase() !== String(val).toLowerCase();
  }
  if (operator === 'ilike' || operator === 'like') {
    const search = String(val).replace(/%/g, '').toLowerCase();
    return String(rowVal).toLowerCase().includes(search);
  }
  return false;
}

// A simple in-memory JS query executor for SQL strings used in the app
export async function localQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  initLocalDb();

  const cleanSql = text.replace(/\s+/g, ' ').trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. SELECT * FROM members WHERE username = $1
  if (lowerSql.startsWith('select') && cleanSql.includes('members') && lowerSql.includes('username =')) {
    const rows = readTable('members');
    const filtered = rows.filter(r => r.username.toLowerCase() === params[0].toLowerCase());
    return { rows: filtered, rowCount: filtered.length };
  }

  // 2. SELECT * FROM members WHERE id = $1
  if (lowerSql.startsWith('select') && cleanSql.includes('members') && lowerSql.includes('id =')) {
    const rows = readTable('members');
    const filtered = rows.filter(r => r.id === params[0]);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 3. SELECT * FROM members
  if (lowerSql.startsWith('select') && cleanSql.includes('members') && !cleanSql.includes('where')) {
    const rows = readTable('members');
    return { rows, rowCount: rows.length };
  }

  // 4. INSERT INTO members
  if (lowerSql.startsWith('insert into members')) {
    const rows = readTable('members');
    // Schema columns: name, username, password_hash, role, job_role, assigned_courses, assigned_property, status, must_change_password
    const newMember = {
      id: localUuid(),
      name: params[0],
      username: params[1],
      password_hash: params[2],
      role: params[3] || 'team',
      job_role: params[4],
      assigned_courses: params[5] || [],
      assigned_property: params[6] || 'Both',
      status: params[7] || 'Active',
      must_change_password: params[8] !== undefined ? params[8] : true,
      created_at: new Date().toISOString(),
    };
    rows.push(newMember);
    writeTable('members', rows);
    return { rows: [newMember], rowCount: 1 };
  }

  // 5. UPDATE members
  if (lowerSql.startsWith('update members')) {
    const rows = readTable('members');
    if (lowerSql.includes('password_hash =') && lowerSql.includes('must_change_password =')) {
      const idx = rows.findIndex(r => r.id === params[2]);
      if (idx !== -1) {
        rows[idx].password_hash = params[0];
        rows[idx].must_change_password = params[1];
        writeTable('members', rows);
        return { rows: [rows[idx]], rowCount: 1 };
      }
    } else if (lowerSql.includes('last_login =')) {
      const idx = rows.findIndex(r => r.id === params[0]);
      if (idx !== -1) {
        rows[idx].last_login = new Date().toISOString();
        writeTable('members', rows);
        return { rows: [rows[idx]], rowCount: 1 };
      }
    } else if (lowerSql.includes('name =') && lowerSql.includes('role =')) {
      const idParam = params[params.length - 1];
      const idx = rows.findIndex(r => r.id === idParam);
      if (idx !== -1) {
        rows[idx].name = params[0];
        rows[idx].role = params[1];
        rows[idx].job_role = params[2];
        rows[idx].assigned_courses = params[3];
        rows[idx].assigned_property = params[4];
        rows[idx].status = params[5];
        writeTable('members', rows);
        return { rows: [rows[idx]], rowCount: 1 };
      }
    }
  }

  // 6. SELECT * FROM websites
  if (lowerSql.startsWith('select') && cleanSql.includes('websites')) {
    const rows = readTable('websites');
    return { rows, rowCount: rows.length };
  }

  // 7. INSERT INTO websites
  if (lowerSql.startsWith('insert into websites')) {
    const rows = readTable('websites');
    const newWeb = {
      id: localUuid(),
      code: params[0],
      domain: params[1],
      property_url: params[2],
      status: 'Active',
      created_at: new Date().toISOString()
    };
    rows.push(newWeb);
    writeTable('websites', rows);
    return { rows: [newWeb], rowCount: 1 };
  }

  // 8. SELECT * FROM courses
  if (cleanSql.includes('from courses')) {
    const rows = readTable('courses');
    return { rows, rowCount: rows.length };
  }

  // 9. INSERT INTO courses
  if (lowerSql.startsWith('insert into courses')) {
    const rows = readTable('courses');
    const newCourse = {
      id: localUuid(),
      course_name: params[0],
      keyword_group: params[1],
      property: params[2] || 'Both',
      priority: params[3] || 'Medium',
      status: 'Active',
      created_at: new Date().toISOString()
    };
    rows.push(newCourse);
    writeTable('courses', rows);
    return { rows: [newCourse], rowCount: 1 };
  }

  // 10. SELECT * FROM competitors
  if (cleanSql.includes('from competitors')) {
    const rows = readTable('competitors');
    return { rows, rowCount: rows.length };
  }

  // 11. INSERT INTO competitors
  if (lowerSql.startsWith('insert into competitors')) {
    const rows = readTable('competitors');
    const newComp = {
      id: localUuid(),
      domain: params[0],
      display_name: params[1],
      threat_level: params[2] || 'Medium',
      tracked_since: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: params[3] || ''
    };
    rows.push(newComp);
    writeTable('competitors', rows);
    return { rows: [newComp], rowCount: 1 };
  }

  // 12. SELECT * FROM keywords_master
  if (cleanSql.includes('from keywords_master')) {
    const rows = readTable('keywords_master');
    return { rows, rowCount: rows.length };
  }

  // 13. INSERT INTO keywords_master
  if (lowerSql.startsWith('insert into keywords_master')) {
    const rows = readTable('keywords_master');
    const newKeyword = {
      id: localUuid(),
      keyword: params[0],
      keyword_group: params[1],
      property: params[2],
      target_url: params[3],
      priority: params[4] || 'Medium',
      status: 'Active',
      added_date: new Date().toISOString().split('T')[0],
      notes: params[5] || ''
    };
    rows.push(newKeyword);
    writeTable('keywords_master', rows);
    return { rows: [newKeyword], rowCount: 1 };
  }

  // 14. SELECT * FROM backlinks
  if (cleanSql.includes('from backlinks')) {
    let rows = readTable('backlinks');
    // Filter if member_id = $1 is in SQL
    if (cleanSql.includes('member_id =') || cleanSql.includes('member_id=')) {
      rows = rows.filter(r => r.member_id === params[0]);
    }
    // Sort by entry_date DESC
    rows.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    return { rows, rowCount: rows.length };
  }

  // 15. INSERT INTO backlinks (bulk helper supported)
  if (lowerSql.startsWith('insert into backlinks')) {
    const rows = readTable('backlinks');
    // Bulk or single inserts
    // Check if the user is passing parameters individually or if they are building a query.
    // If it's a dynamic SQL constructed with VALUES, we can parse it, or we can just append
    // the parameters if it's a single insert.
    // In our api, we will call it row by row, or pass an array.
    // Let's support standard single insert:
    // entry_date, member_id, member_name, property, course, location, keyword_targeted, link_type, url, root_domain, da, spam_score, status, notes
    const newLink = {
      id: localUuid(),
      entry_date: params[0],
      member_id: params[1],
      member_name: params[2],
      property: params[3],
      course: params[4],
      location: params[5],
      keyword_targeted: params[6],
      link_type: params[7],
      url: params[8],
      root_domain: params[9],
      da: parseInt(params[10]) || 0,
      spam_score: parseInt(params[11]) || 0,
      status: params[12] || 'Pending',
      notes: params[13] || '',
      created_at: new Date().toISOString(),
    };
    rows.push(newLink);
    writeTable('backlinks', rows);
    return { rows: [newLink], rowCount: 1 };
  }

  // 16. SELECT * FROM shared_domains
  if (cleanSql.includes('from shared_domains')) {
    const rows = readTable('shared_domains');
    // Handle filters or ordering if needed
    return { rows, rowCount: rows.length };
  }

  // 17. INSERT/UPDATE shared_domains
  if (lowerSql.startsWith('insert into shared_domains') || lowerSql.startsWith('update shared_domains')) {
    const rows = readTable('shared_domains');
    // If insert with ON CONFLICT (domain) DO UPDATE
    if (lowerSql.includes('on conflict')) {
      const domain = params[0];
      const idx = rows.findIndex(r => r.domain === domain);
      if (idx !== -1) {
        // Update
        const countDiff = params[3] || 1;
        rows[idx].last_used_date = new Date().toISOString().split('T')[0];
        rows[idx].total_uses += countDiff;
        if (params[4] === 1 || params[4] === 'Live') rows[idx].live_count++;
        else if (params[5] === 1 || params[5] === 'Pending') rows[idx].pending_count++;
        else if (params[6] === 1 || params[6] === 'Rejected') rows[idx].rejected_count++;
        // update averages
        rows[idx].avg_da = Math.round((rows[idx].avg_da + (params[7] || 0)) / 2 * 10) / 10;
        rows[idx].avg_spam = Math.round((rows[idx].avg_spam + (params[8] || 0)) / 2 * 10) / 10;
        rows[idx].updated_at = new Date().toISOString();
      } else {
        // Insert
        rows.push({
          id: localUuid(),
          domain: params[0],
          first_used_by: params[1],
          first_used_date: params[2],
          last_used_date: params[2],
          total_uses: params[3] || 1,
          live_count: params[4] || 0,
          pending_count: params[5] || 0,
          rejected_count: params[6] || 0,
          live_rate: 0,
          avg_da: params[7] || 0,
          avg_spam: params[8] || 0,
          best_link_type: '',
          link_type_stats: {},
          status: 'Ok',
          admin_override: null,
          admin_note: '',
          updated_at: new Date().toISOString()
        });
      }
      // recalculate rates
      rows.forEach(r => {
        r.live_rate = r.total_uses > 0 ? Math.round((r.live_count / r.total_uses) * 100) : 0;
        if (r.admin_override) {
          r.status = r.admin_override;
        } else if (r.avg_spam > 30) {
          r.status = 'Avoid';
        } else if (r.total_uses < 2) {
          r.status = 'Ok';
        } else if (r.live_rate >= 80 && r.avg_da >= 35) {
          r.status = 'Great';
        } else if (r.live_rate >= 65) {
          r.status = 'Good';
        } else if (r.live_rate >= 40) {
          r.status = 'Ok';
        } else {
          r.status = 'Avoid';
        }
      });
      writeTable('shared_domains', rows);
    }
    return { rows, rowCount: rows.length };
  }

  // 18. SELECT * FROM work_log
  if (cleanSql.includes('from work_log')) {
    let rows = readTable('work_log');
    if (cleanSql.includes('member_id =')) {
      rows = rows.filter(r => r.member_id === params[0]);
    }
    rows.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
    return { rows, rowCount: rows.length };
  }

  // 19. INSERT INTO work_log
  if (lowerSql.startsWith('insert into work_log')) {
    const rows = readTable('work_log');
    const newLog = {
      id: localUuid(),
      log_date: params[0],
      member_id: params[1],
      member_name: params[2],
      course_worked_on: params[3],
      free_notes: params[4],
      websites_researched: parseInt(params[5]) || 0,
      da_pa_checked: parseInt(params[6]) || 0,
      content_written: parseInt(params[7]) || 0,
      social_posts_shared: parseInt(params[8]) || 0,
      quora_reddit_posts: parseInt(params[9]) || 0,
      hours_spent: parseFloat(params[10]) || 0,
      created_at: new Date().toISOString()
    };
    rows.push(newLog);
    writeTable('work_log', rows);
    return { rows: [newLog], rowCount: 1 };
  }

  // 20. SELECT * FROM keyword_positions
  if (cleanSql.includes('from keyword_positions')) {
    let rows = readTable('keyword_positions');
    return { rows, rowCount: rows.length };
  }

  // 21. SELECT * FROM serp_daily
  if (cleanSql.includes('from serp_daily')) {
    let rows = readTable('serp_daily');
    return { rows, rowCount: rows.length };
  }

  // 22. SELECT * FROM alerts
  if (cleanSql.includes('from alerts')) {
    let rows = readTable('alerts');
    if (cleanSql.includes('assigned_member_id =')) {
      rows = rows.filter(r => r.assigned_member_id === params[0]);
    }
    return { rows, rowCount: rows.length };
  }

  // 23. SELECT * FROM monthly_plans
  if (cleanSql.includes('from monthly_plans')) {
    let rows = readTable('monthly_plans');
    return { rows, rowCount: rows.length };
  }

  // 24. SELECT * FROM notifications
  if (cleanSql.includes('from notifications')) {
    let rows = readTable('notifications');
    if (cleanSql.includes('member_id =')) {
      rows = rows.filter(r => r.member_id === params[0]);
      if (cleanSql.includes('is_read = false')) {
        rows = rows.filter(r => !r.is_read);
      }
    }
    return { rows, rowCount: rows.length };
  }

  // Default catch-all for other simple SELECTs
  const tableMatch = lowerSql.match(/from\s+([a-zA-Z0-9_]+)/);
  if (tableMatch) {
    const tableName = tableMatch[1];
    if (fs.existsSync(path.join(DB_DIR, `${tableName}.json`))) {
      const rows = readTable(tableName);
      return { rows, rowCount: rows.length };
    }
  }

  // Return empty structure for unhandled queries
  return { rows: [], rowCount: 0 };
}
