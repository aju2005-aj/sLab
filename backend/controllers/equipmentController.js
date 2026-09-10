const db = require('../config/db');

const getEquipment = (req, res) => {
  db.all(`SELECT e.*, l.name as lab_name FROM equipment e LEFT JOIN laboratories l ON e.lab_id = l.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const getEquipmentByQR = (req, res) => {
  const { qr } = req.params;
  db.get(`SELECT e.*, l.name as lab_name FROM equipment e LEFT JOIN laboratories l ON e.lab_id = l.id WHERE e.qr_code = ?`, [qr], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Equipment not found' });
    res.json(row);
  });
};

const createEquipment = (req, res) => {
  const { name, lab_id, status, qr_code, priority } = req.body;
  const sql = `INSERT INTO equipment (name, lab_id, status, qr_code, priority) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [name, parseInt(lab_id, 10), status || 'active', qr_code, priority || 'normal'], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    
    const io = req.app.get('io');
    if (io) io.emit('equipment_update');
    
    res.status(201).json({ id: this.lastID, message: 'Equipment added successfully' });
  });
};

const updateEquipment = (req, res) => {
  const equipmentId = parseInt(req.params.id, 10);
  const { name, lab_id, qr_code, priority } = req.body;

  if (Number.isNaN(equipmentId)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }
  if (!name || !name.trim() || !lab_id || !qr_code || !qr_code.trim()) {
    return res.status(400).json({ message: 'Equipment name, laboratory, and QR code are required' });
  }

  db.run(
    `UPDATE equipment SET name = ?, lab_id = ?, qr_code = ?, priority = ? WHERE id = ?`,
    [name.trim(), parseInt(lab_id, 10), qr_code.trim(), priority || 'normal', equipmentId],
    function(err) {
      if (err) {
        if (err.code === '23505' || err.message.includes('UNIQUE')) {
          return res.status(409).json({ message: 'QR code already exists' });
        }
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) return res.status(404).json({ message: 'Equipment not found' });

      const io = req.app.get('io');
      if (io) io.emit('equipment_update');
      res.json({ message: 'Equipment updated successfully' });
    }
  );
};

const deleteEquipment = (req, res) => {
  const equipmentId = parseInt(req.params.id, 10);

  if (Number.isNaN(equipmentId)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }

  db.run(`DELETE FROM fault_reports WHERE eq_id = ?`, [equipmentId], (faultErr) => {
    if (faultErr) return res.status(500).json({ message: faultErr.message });

    db.run(`DELETE FROM equipment WHERE id = ?`, [equipmentId], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Equipment not found' });

      const io = req.app.get('io');
      if (io) io.emit('equipment_update');
      res.json({ message: 'Equipment removed successfully' });
    });
  });
};

const getLaboratories = (req, res) => {
  db.all(`SELECT * FROM laboratories`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const createLaboratory = (req, res) => {
  const { name, location } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Laboratory name is required' });
  }

  db.run(
    `INSERT INTO laboratories (name, location) VALUES (?, ?)`,
    [name.trim(), location ? location.trim() : null],
    function(err) {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ id: this.lastID, message: 'Laboratory added successfully' });
    }
  );
};

const deleteLaboratory = (req, res) => {
  const labId = parseInt(req.params.id, 10);

  if (Number.isNaN(labId)) {
    return res.status(400).json({ message: 'Invalid laboratory ID' });
  }

  db.get(`SELECT COUNT(*) AS count FROM equipment WHERE lab_id = ?`, [labId], (countErr, row) => {
    if (countErr) return res.status(500).json({ message: countErr.message });
    if (row && row.count > 0) {
      return res.status(409).json({ message: 'Remove or reassign the laboratory equipment before deleting this lab' });
    }

    db.run(`DELETE FROM laboratories WHERE id = ?`, [labId], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Laboratory not found' });
      res.json({ message: 'Laboratory deleted successfully' });
    });
  });
};

module.exports = {
  getEquipment,
  getEquipmentByQR,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getLaboratories,
  createLaboratory,
  deleteLaboratory
};
