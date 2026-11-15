// ==============================================================================
// Member 3: REST API Development
// Files Owned: endpoints.js
// Key Responsibilities:
// 1. Implement Camera CRUD endpoints (POST, GET, GET by ID, PUT, DELETE).
// 2. Implement Photographer endpoints (POST registration, GET list).
// 3. Implement Rental booking endpoint with foreign key validation (POST /rentals).
// 4. Implement relational SQL INNER JOIN query (GET /rentals) returning human-readable details.
// 5. Catch foreign key constraint violations and return appropriate HTTP 409 Conflict.
// ==============================================================================

const { getDB } = require('./database/database');
const { searchCameras } = require('./validation');

// ==================== CAMERA ENDPOINTS ====================

// GET /cameras (Handles retrieving all cameras, or delegates to search if kind is present)
const getAllCameras = async (req, res) => {
  const { kind } = req.query;
  if (kind !== undefined) {
    return searchCameras(req, res);
  }

  try {
    const db = getDB();
    const query = `SELECT * FROM cameras;`;
    const cameras = await db.all(query);
    res.status(200).json(cameras);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cameras' });
  }
};

// GET /cameras/:cameraId
const getCameraById = async (req, res) => {
  try {
    const db = getDB();
    const { cameraId } = req.params;
    const query = `SELECT * FROM cameras WHERE camera_id = ?;`;
    const camera = await db.get(query, [cameraId]);

    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.status(200).json(camera);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve camera' });
  }
};

// POST /cameras (Camera validation middleware is executed before this handler)
const addCamera = async (req, res) => {
  try {
    const db = getDB();
    const { name, kind } = req.body;
    const query = `INSERT INTO cameras (name, kind) VALUES (?, ?);`;
    const result = await db.run(query, [name.trim(), kind.trim()]);

    res.status(201).json({
      message: 'Camera added successfully',
      cameraId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add camera' });
  }
};

// PUT /cameras/:cameraId (Camera validation middleware is executed before this handler)
const updateCamera = async (req, res) => {
  try {
    const db = getDB();
    const { cameraId } = req.params;
    const { name, kind } = req.body;

    // Check if camera exists
    const checkQuery = `SELECT * FROM cameras WHERE camera_id = ?;`;
    const existingCamera = await db.get(checkQuery, [cameraId]);

    if (!existingCamera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const updateQuery = `
      UPDATE cameras 
      SET name = ?, kind = ? 
      WHERE camera_id = ?;
    `;
    await db.run(updateQuery, [name.trim(), kind.trim(), cameraId]);

    res.status(200).json({ message: 'Camera updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update camera' });
  }
};

// DELETE /cameras/:cameraId
const deleteCamera = async (req, res) => {
  try {
    const db = getDB();
    const { cameraId } = req.params;

    // Check if camera exists
    const checkQuery = `SELECT * FROM cameras WHERE camera_id = ?;`;
    const existingCamera = await db.get(checkQuery, [cameraId]);

    if (!existingCamera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const deleteQuery = `DELETE FROM cameras WHERE camera_id = ?;`;
    await db.run(deleteQuery, [cameraId]);

    res.status(200).json({ message: 'Camera deleted successfully' });
  } catch (error) {
    // Foreign key constraint failure in SQLite
    if (error.code === 'SQLITE_CONSTRAINT' || (error.message && error.message.includes('FOREIGN KEY'))) {
      return res.status(409).json({
        error: 'Camera cannot be deleted because it is associated with a rental',
      });
    }
    res.status(500).json({ error: 'Failed to delete camera' });
  }
};

// ==================== PHOTOGRAPHER ENDPOINTS ====================

// GET /photographers
const getAllPhotographers = async (req, res) => {
  try {
    const db = getDB();
    const query = `SELECT * FROM photographers;`;
    const photographers = await db.all(query);
    res.status(200).json(photographers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve photographers' });
  }
};

// POST /photographers
const addPhotographer = async (req, res) => {
  try {
    const db = getDB();
    const { name, phone, email } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Photographer name is required' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ error: 'Photographer phone is required' });
    }

    const query = `
      INSERT INTO photographers (name, phone, email) 
      VALUES (?, ?, ?);
    `;
    const result = await db.run(query, [
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
    ]);

    res.status(201).json({
      message: 'Photographer added successfully',
      photographerId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photographer' });
  }
};

// ==================== RENTAL ENDPOINTS ====================

// POST /rentals
const addRental = async (req, res) => {
  try {
    const db = getDB();
    const { photographer_id, camera_id, rental_date, return_date } = req.body;

    if (!photographer_id || !camera_id || !rental_date) {
      return res.status(400).json({
        error: 'photographer_id, camera_id, and rental_date are required',
      });
    }

    // Verify foreign key references exist
    const photographer = await db.get(
      `SELECT * FROM photographers WHERE photographer_id = ?;`,
      [photographer_id]
    );
    if (!photographer) {
      return res.status(400).json({ error: 'Invalid photographer_id: photographer does not exist' });
    }

    const camera = await db.get(
      `SELECT * FROM cameras WHERE camera_id = ?;`,
      [camera_id]
    );
    if (!camera) {
      return res.status(400).json({ error: 'Invalid camera_id: camera does not exist' });
    }

    const query = `
      INSERT INTO rentals (photographer_id, camera_id, rental_date, return_date) 
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(query, [
      photographer_id,
      camera_id,
      rental_date,
      return_date || null,
    ]);

    res.status(201).json({
      message: 'Rental added successfully',
      rentalId: result.lastID,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Foreign key constraint failed' });
    }
    res.status(500).json({ error: 'Failed to add rental' });
  }
};

// GET /rentals (SQL JOIN returning photographer and camera names)
const getRentals = async (req, res) => {
  try {
    const db = getDB();
    const query = `
      SELECT 
        rentals.rental_id,
        photographers.name AS photographer_name,
        cameras.name AS camera_name,
        cameras.kind,
        rentals.rental_date,
        rentals.return_date
      FROM rentals
      INNER JOIN photographers ON rentals.photographer_id = photographers.photographer_id
      INNER JOIN cameras ON rentals.camera_id = cameras.camera_id;
    `;
    const rentals = await db.all(query);
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve rentals' });
  }
};

module.exports = {
  getAllCameras,
  getCameraById,
  addCamera,
  updateCamera,
  deleteCamera,
  getAllPhotographers,
  addPhotographer,
  addRental,
  getRentals,
};
