const db = require('../config/db');

const getSuggestions = (req, res) => {
  const { description, eq_id } = req.body;
  
  if (!description) {
    return res.json({ suggestions: [] });
  }

  const descLower = description.toLowerCase();
  const suggestions = [];

  const defaultRules = [
    { keyword: 'network', suggestion: 'In some cases, it may be an ethernet problem. Please check it.' },
    { keyword: 'internet', suggestion: 'In some cases, it may be an ethernet problem. Please check it.' },
    { keyword: 'wifi', suggestion: 'In some cases, it may be an ethernet problem. Please check it.' },
    { keyword: 'ethernet', suggestion: 'In some cases, it may be an ethernet problem. Please check it.' },
    { keyword: 'power', suggestion: 'Check if the device is plugged in and the main switch is on.' },
    { keyword: 'display', suggestion: 'Check VGA/HDMI cables and ensure monitor is powered.' },
    { keyword: 'boot', suggestion: 'Check for beep codes, ensure RAM is seated properly.' },
    { keyword: 'noise', suggestion: 'Could be a fan issue. Turn off immediately to prevent overheating.' }
  ];

  defaultRules.forEach(rule => {
    if (descLower.includes(rule.keyword.toLowerCase())) {
      if (!suggestions.includes(rule.suggestion)) {
        suggestions.push(rule.suggestion);
      }
    }
  });

  db.all(`SELECT * FROM ai_rules`, [], (err, rules) => {
    if (!err && rules) {
      rules.forEach(rule => {
        if (descLower.includes(rule.keyword.toLowerCase())) {
          if (!suggestions.includes(rule.suggestion)) {
            suggestions.push(rule.suggestion);
          }
        }
      });
    } else if (err) {
      console.error("Error fetching rules from DB, using fallback rules:", err.message);
    }

    const isNetworkIssue = descLower.includes('network') || descLower.includes('internet') || descLower.includes('wifi') || descLower.includes('ethernet');
    
    const checkCluster = new Promise((resolve) => {
      if (isNetworkIssue) {
        db.get(`SELECT COUNT(*) as count FROM fault_reports WHERE (description LIKE '%network%' OR description LIKE '%internet%' OR description LIKE '%wifi%' OR description LIKE '%ethernet%') AND status != 'solved'`, (err, row) => {
          if (row && row.count >= 2) {
            suggestions.push("Cluster Warning: Multiple network issues detected across the lab. It may be a router or main switch problem.");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });

    const checkRepeated = new Promise((resolve) => {
      if (eq_id && description) {
        db.get(`SELECT COUNT(*) as count FROM fault_reports WHERE eq_id = ? AND LOWER(description) LIKE '%' || ? || '%'`, [eq_id, descLower.trim()], (err, row) => {
          if (row && row.count >= 2) {
            suggestions.push("🔄 Repeated Problem Warning: This exact or similar issue has been reported multiple times for this equipment.");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });

    Promise.all([checkCluster, checkRepeated]).then(() => {
      res.json({ suggestions });
    });
  });
};

module.exports = {
  getSuggestions
};
