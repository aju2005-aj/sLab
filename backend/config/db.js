const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  ...(connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || process.env.DB_HOST,
        port: Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
        database: process.env.PGDATABASE || process.env.DB_NAME,
        user: process.env.PGUSER || process.env.DB_USER,
        password: String(process.env.PGPASSWORD ?? process.env.DB_PASSWORD ?? '')
      }),
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
});

function postgresQuery(sql, params = [], callback) {
  let parameterIndex = 0;
  const postgresSql = sql.replace(/\?/g, () => `$${++parameterIndex}`);

  pool.query(postgresSql, params, (err, result) => {
    if (err) return callback(err);
    const rows = result.rows.map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (['count', 'total', 'pending', 'solved', 'equipment'].includes(key)) {
          return [key, Number(value)];
        }
        return [key, value];
      })
    ));
    callback(null, { rows, rowCount: result.rowCount });
  });
}

const db = {
  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const done = typeof callback === 'function' ? callback : () => {};
    postgresQuery(sql, params, (err, result) => done(err, result && result.rows[0]));
  },

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const done = typeof callback === 'function' ? callback : () => {};
    postgresQuery(sql, params, (err, result) => done(err, result && result.rows));
  },

  run(sql, params = [], callback = () => {}) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const done = typeof callback === 'function' ? callback : () => {};
    const insertSql = /^\s*INSERT\s/i.test(sql) && !/\bRETURNING\b/i.test(sql)
      ? `${sql} RETURNING id`
      : sql;
    postgresQuery(insertSql, params, (err, result) => {
      const context = {
        lastID: result && result.rows[0] ? result.rows[0].id : undefined,
        changes: result ? result.rowCount : 0
      };
      done.call(context, err);
    });
  },

  prepare(sql) {
    return {
      run: (params, callback) => db.run(sql, params, callback),
      finalize: (callback = () => {}) => {
        if (typeof callback === 'function') callback();
      }
    };
  },

  serialize(callback) {
    if (typeof callback === 'function') callback();
  }
};

async function initDb() {
  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )`,

    `CREATE TABLE IF NOT EXISTS laboratories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      lab_id INTEGER,
      status TEXT DEFAULT 'active',
      qr_code TEXT UNIQUE,
      priority TEXT DEFAULT 'normal',
      FOREIGN KEY(lab_id) REFERENCES laboratories(id)
    )`,

    `CREATE TABLE IF NOT EXISTS fault_reports (
      id SERIAL PRIMARY KEY,
      eq_id INTEGER,
      user_id INTEGER,
      technician_id INTEGER,
      status TEXT DEFAULT 'pending',
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      remarks TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(eq_id) REFERENCES equipment(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(technician_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS ai_rules (
      id SERIAL PRIMARY KEY,
      keyword TEXT UNIQUE NOT NULL,
      suggestion TEXT NOT NULL
    )`,

    `ALTER TABLE equipment ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'`,
    `ALTER TABLE fault_reports ADD COLUMN IF NOT EXISTS remarks TEXT`
  ];

  for (const statement of schema) {
    await pool.query(statement);
  }
  await seedInitialData();
}

async function seedInitialData() {
  const users = await pool.query('SELECT COUNT(*)::int as count FROM users');
  if (users.rows[0].count === 0) {
      try {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          ['System Admin', 'admin@example.com', hash, 'admin']);
        console.log('Created default admin user: admin@example.com / admin123');

        const userHash = bcrypt.hashSync('user123', salt);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          ['Student Alice', 'user@example.com', userHash, 'user']);

        const techHash = bcrypt.hashSync('tech123', salt);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          ['Demo Technician', 'tech@example.com', techHash, 'technician']);
        console.log('Created default tech user: tech@example.com / tech123');
      } catch (e) {
        console.error("Bcrypt error:", e);
      }
  }

  const rulesCount = await pool.query('SELECT COUNT(*)::int as count FROM ai_rules');
  if (rulesCount.rows[0].count === 0) {
      const rules = [
        { keyword: 'power', suggestion: 'Check if the device is plugged in and the main switch is on.' },
        { keyword: 'display', suggestion: 'Check VGA/HDMI cables and ensure monitor is powered.' },
        { keyword: 'network', suggestion: 'Verify LAN cable is connected and router is active.' },
        { keyword: 'internet', suggestion: 'Verify LAN cable is connected and router is active.' },
        { keyword: 'boot', suggestion: 'Check for beep codes, ensure RAM is seated properly.' },
        { keyword: 'noise', suggestion: 'Could be a fan issue. Turn off immediately to prevent overheating.' }
      ];
      
      for (const rule of rules) {
        await pool.query('INSERT INTO ai_rules (keyword, suggestion) VALUES ($1, $2)', [rule.keyword, rule.suggestion]);
      }
      console.log('Seeded default AI fix rules.');
  }

  const labs = await pool.query('SELECT COUNT(*)::int as count FROM laboratories');
  if (labs.rows[0].count === 0) {
    const lab = await pool.query("INSERT INTO laboratories (name, location) VALUES ('Computer Lab 1', 'Building A, Room 101') RETURNING id");
    const labId = lab.rows[0].id;
    await pool.query("INSERT INTO equipment (name, lab_id, status, qr_code) VALUES ('Dell Optiplex PC-01', $1, 'active', 'EQ-COMP-01')", [labId]);
    await pool.query("INSERT INTO equipment (name, lab_id, status, qr_code) VALUES ('Cisco Switch-01', $1, 'active', 'EQ-NET-01')", [labId]);
  }
}

const ready = initDb().then(() => {
  console.log('Connected to PostgreSQL database.');
});

module.exports = { ...db, ready };
