const db = require('../config/db');

const getSuggestions = (req, res) => {
  const { description, eq_id } = req.body;
  
  if (!description) {
    return res.json({ suggestions: [] });
  }

  const descLower = description.toLowerCase();
  const suggestions = [];

  // Default hardcoded robust rules matching the user requirements
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

  // Match default rules
  defaultRules.forEach(rule => {
    if (descLower.includes(rule.keyword.toLowerCase())) {
      if (!suggestions.includes(rule.suggestion)) {
        suggestions.push(rule.suggestion);
      }
    }
  });

  // Query database for additional rules or customized rules
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

    // 2. Check for Cluster Reporting (Network issues)
    const isNetworkIssue = descLower.includes('network') || descLower.includes('internet') || descLower.includes('wifi') || descLower.includes('ethernet');
    
    const checkCluster = new Promise((resolve) => {
      if (isNetworkIssue) {
        db.get(`SELECT COUNT(*) as count FROM fault_reports WHERE (description LIKE '%network%' OR description LIKE '%internet%' OR description LIKE '%wifi%' OR description LIKE '%ethernet%') AND status != 'solved'`, (err, row) => {
          if (row && row.count >= 2) { // 2 existing + 1 new = 3
            suggestions.push("Cluster Warning: Multiple network issues detected across the lab. It may be a router or main switch problem.");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });

    // 3. Check for Repeated Faults
    const checkRepeated = new Promise((resolve) => {
      if (eq_id && description) {
        db.get(`SELECT COUNT(*) as count FROM fault_reports WHERE eq_id = ? AND LOWER(description) LIKE '%' || ? || '%'`, [eq_id, descLower.trim()], (err, row) => {
          if (row && row.count >= 2) { // more than 2 times means >= 2 previous + this one, so if count >= 2
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
