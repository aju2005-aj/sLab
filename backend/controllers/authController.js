const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_here', {
    expiresIn: '30d',
  });
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email ? email.trim().toLowerCase() : email], (err, user) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(password, user.password);
    } catch (e) {
    }
    
    if (!isMatch && user.password === password) {
      isMatch = true;
    }

    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
    });
  });
};

const getMe = (req, res) => {
  db.get(`SELECT id, name, email, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  });
};

const getTechnicians = (req, res) => {
  db.all(`SELECT id, name, email FROM users WHERE role = 'technician'`, [], (err, technicians) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(technicians);
  });
};

const createTechnician = (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  db.run(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'technician')`, 
    [name.trim(), email.trim().toLowerCase(), hash],
    function(err) {
      if (err) {
        if (err.code === '23505' || err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Email already exists' });
        }
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Technician created successfully' });
    }
  );
};

const updateTechnician = (req, res) => {
  const technicianId = parseInt(req.params.id, 10);
  const { name, email, password } = req.body;

  if (Number.isNaN(technicianId)) {
    return res.status(400).json({ message: 'Invalid technician ID' });
  }
  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const values = [name.trim(), email.trim().toLowerCase()];
  let sql = `UPDATE users SET name = ?, email = ?`;
  if (password && password.trim()) {
    values.push(bcrypt.hashSync(password, bcrypt.genSaltSync(10)));
    sql += `, password = ?`;
  }
  sql += ` WHERE id = ? AND role = 'technician'`;
  values.push(technicianId);

  db.run(sql, values, function(err) {
    if (err) {
      if (err.code === '23505' || err.message.includes('UNIQUE')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: err.message });
    }
    if (this.changes === 0) return res.status(404).json({ message: 'Technician not found' });
    res.json({ message: 'Technician updated successfully' });
  });
};

const deleteTechnician = (req, res) => {
  const technicianId = parseInt(req.params.id, 10);

  if (Number.isNaN(technicianId)) {
    return res.status(400).json({ message: 'Invalid technician ID' });
  }

  db.run(`UPDATE fault_reports SET technician_id = NULL WHERE technician_id = ?`, [technicianId], (clearErr) => {
    if (clearErr) return res.status(500).json({ message: clearErr.message });

    db.run(`DELETE FROM users WHERE id = ? AND role = 'technician'`, [technicianId], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Technician not found' });
      res.json({ message: 'Technician removed successfully' });
    });
  });
};

module.exports = {
  loginUser,
  getMe,
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician
};
