const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMigrations,
    createMigration
} = require('../controllers/migrationController');

router.route('/')
    .get(protect, admin, getMigrations)
    .post(protect, admin, createMigration);

module.exports = router;
