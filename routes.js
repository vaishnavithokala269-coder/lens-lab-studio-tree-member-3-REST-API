// ==============================================================================
// Member 1: Backend Server & Routing
// Files Owned: server.js, routes.js
// Key Responsibilities:
// 1. Define Express router instance.
// 2. Map HTTP methods and endpoints to their respective controller handlers.
// 3. Enforce route declaration priority: /cameras/summary MUST precede /cameras/:cameraId
//    to prevent Express route parameter shadowing.
// 4. Attach validation middleware to write endpoints (POST /cameras, PUT /cameras/:cameraId).
// ==============================================================================

const express = require('express');
const router = express.Router();

// Import endpoint handlers (Member 3: REST API Development)
const {
  getAllCameras,
  getCameraById,
  addCamera,
  updateCamera,
  deleteCamera,
  getAllPhotographers,
  addPhotographer,
  addRental,
  getRentals,
} = require('./endpoints');

// Import validation middleware (Member 4: Validation, Search & Special Requirements)
const { validateCamera } = require('./validation');

// Import twist summary handler (Member 4: Validation, Search & Special Requirements)
const { getCameraSummary } = require('./summary');

// ==================== ROOT / HEALTH CHECK ROUTE ====================
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to LensLab Studio API - Camera Rental Management System',
    status: 'running',
    version: '1.0.0',
  });
});

// ==================== PHOTOGRAPHER ROUTES ====================
router.get('/photographers', getAllPhotographers);
router.post('/photographers', addPhotographer);

// ==================== CAMERA ROUTES ====================
// IMPORTANT: GET /cameras/summary MUST be defined before GET /cameras/:cameraId
// so Express does not treat the string 'summary' as a cameraId parameter.
router.get('/cameras/summary', getCameraSummary);

// Camera list and search (?kind=...)
router.get('/cameras', getAllCameras);

// Camera by ID
router.get('/cameras/:cameraId', getCameraById);

// Camera creation with validation
router.post('/cameras', validateCamera, addCamera);

// Camera update with validation
router.put('/cameras/:cameraId', validateCamera, updateCamera);

// Camera deletion
router.delete('/cameras/:cameraId', deleteCamera);

// ==================== RENTAL ROUTES ====================
router.get('/rentals', getRentals);
router.post('/rentals', addRental);

module.exports = router;
