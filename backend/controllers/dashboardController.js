const db = require('../config/db');

const getDashboardStats = (req, res) => {
  const stats = {};

  db.serialize(() => {
    db.get(`SELECT COUNT(*) as total FROM fault_reports`, (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      stats.total_faults = row.total;
    });

    db.get(`SELECT COUNT(*) as pending FROM fault_reports WHERE status = 'pending'`, (err, row) => {
      stats.pending_faults = row ? row.pending : 0;
    });

    db.get(`SELECT COUNT(*) as solved FROM fault_reports WHERE status = 'solved'`, (err, row) => {
      stats.solved_faults = row ? row.solved : 0;
    });

    db.get(`SELECT COUNT(*) as equipment FROM equipment`, (err, row) => {
      stats.total_equipment = row ? row.equipment : 0;
      
      res.json(stats);
    });
  });
};

module.exports = {
  getDashboardStats
};
