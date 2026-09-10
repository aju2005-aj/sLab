const express = require('express');
const router = express.Router();
const { loginUser, getMe, getTechnicians, createTechnician, updateTechnician, deleteTechnician } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/technicians', protect, adminOnly, getTechnicians);
router.post('/technicians', protect, adminOnly, createTechnician);
router.put('/technicians/:id', protect, adminOnly, updateTechnician);
router.delete('/technicians/:id', protect, adminOnly, deleteTechnician);

module.exports = router;
