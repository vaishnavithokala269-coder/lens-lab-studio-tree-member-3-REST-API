// ==============================================================================
// Member 4: Validation, Search & Special Requirements
// Files Owned: validation.js, summary.js
// Key Responsibilities (summary.js):
// 1. Implement GET /cameras/summary endpoint for inventory aggregation.
// 2. Execute SQL GROUP BY query to aggregate camera inventory counts by kind directly in SQLite.
// 3. Satisfy Special Twist requirements: return [] when empty, and [{ kind, count }] when populated.
// ==============================================================================

const { getDB } = require('./database/database');

// GET /cameras/summary
// Aggregates cameras by their kind using SQLite GROUP BY
const getCameraSummary = async (req, res) => {
  try {
    const db = getDB();

    // SQLite GROUP BY performs the aggregation at database level
    const summaryQuery = `
      SELECT kind, COUNT(*) AS count 
      FROM cameras 
      GROUP BY kind;
    `;

    const summary = await db.all(summaryQuery);

    // Returns an array of objects: [ { kind: 'DSLR', count: 4 }, ... ]
    // When the cameras table is empty, SQLite returns an empty array [] with status 200
    res.status(200).json(summary || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve camera summary' });
  }
};

module.exports = {
  getCameraSummary,
};
