const db = require('../config/db');

const createFaultReport = (req, res) => {
  const { eq_id, description } = req.body;
  const user_id = req.user ? req.user.id : null;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const parsedEqId = parseInt(eq_id, 10);

  db.get(`SELECT priority FROM equipment WHERE id = ?`, [parsedEqId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    const priority = row ? row.priority : 'normal';

    const sql = `INSERT INTO fault_reports (eq_id, user_id, description, priority, image_url) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [parsedEqId, user_id, description, priority, image_url], function(err) {
      if (err) return res.status(500).json({ message: err.message, errorType: 'SQL_ERROR' });
      
      const newId = this.lastID;
      
      db.run(`UPDATE equipment SET status = 'faulty' WHERE id = ?`, [parsedEqId], (updateErr) => {
        if (updateErr) console.error("Error updating equipment status:", updateErr);
        
        const io = req.app.get('io');
        if (io) {
          io.emit('new_fault', { id: newId, eq_id: parsedEqId, user_id, description, priority, status: 'pending', image_url });
          io.emit('equipment_update');
        }

        res.status(201).json({ id: newId, message: 'Fault reported successfully', image_url });
      });
    });
  });
};

const getFaultReports = (req, res) => {
  let sql = `SELECT f.*, e.name as equipment_name, l.name as lab_name, u.name as reported_by, t.name as technician_name
             FROM fault_reports f
             LEFT JOIN equipment e ON f.eq_id = e.id
             LEFT JOIN laboratories l ON e.lab_id = l.id
             LEFT JOIN users u ON f.user_id = u.id
             LEFT JOIN users t ON f.technician_id = t.id`;

  const orderClause = ` ORDER BY 
    CASE f.priority 
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 5 
    END ASC, f.created_at DESC`;
  
  if (req.user.role === 'technician') {
    sql += ` WHERE f.technician_id = ${req.user.id}` + orderClause;
  } else if (req.user.role === 'user') {
    sql += ` WHERE f.user_id = ${req.user.id}` + orderClause;
  } else {
    sql += orderClause;
  }

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateFaultReport = (req, res) => {
  const { id } = req.params;
  const { status, technician_id, remarks } = req.body;
  const updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let sql = `UPDATE fault_reports SET status = ?, updated_at = ?`;
  let params = [status, updatedAt];

  if (technician_id !== undefined) {
    sql += `, technician_id = ?`;
    params.push(technician_id);
  }
  if (remarks !== undefined) {
    sql += `, remarks = ?`;
    params.push(remarks);
  }

  sql += ` WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Report not found' });

    if (status === 'solved') {
      db.get(`SELECT eq_id FROM fault_reports WHERE id = ?`, [id], (err, row) => {
        if (row) {
          db.run(`UPDATE equipment SET status = 'active' WHERE id = ?`, [row.eq_id], () => {
            const io = req.app.get('io');
            if (io) io.emit('equipment_update');
          });
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('update_fault', { id, status, technician_id });
    }

    res.json({ message: 'Fault report updated successfully' });
  });
};

const deleteFaultReport = (req, res) => {
  const faultId = parseInt(req.params.id, 10);

  if (Number.isNaN(faultId)) {
    return res.status(400).json({ message: 'Invalid fault report ID' });
  }

  db.get(`SELECT eq_id FROM fault_reports WHERE id = ?`, [faultId], (lookupErr, fault) => {
    if (lookupErr) return res.status(500).json({ message: lookupErr.message });
    if (!fault) return res.status(404).json({ message: 'Fault report not found' });

    db.run(`DELETE FROM fault_reports WHERE id = ?`, [faultId], function(deleteErr) {
      if (deleteErr) return res.status(500).json({ message: deleteErr.message });

      const restoreEquipment = () => {
        if (!fault.eq_id) return res.json({ message: 'Fault report deleted successfully' });
        db.get(`SELECT COUNT(*) AS count FROM fault_reports WHERE eq_id = ? AND status != 'solved'`, [fault.eq_id], (countErr, row) => {
          if (countErr) return res.status(500).json({ message: countErr.message });
          if (row && row.count === 0) {
            db.run(`UPDATE equipment SET status = 'active' WHERE id = ?`, [fault.eq_id], () => {});
          }
          const io = req.app.get('io');
          if (io) io.emit('equipment_update');
          res.json({ message: 'Fault report deleted successfully' });
        });
      };

      restoreEquipment();
    });
  });
};

module.exports = {
  createFaultReport,
  getFaultReports,
  updateFaultReport,
  deleteFaultReport
};
