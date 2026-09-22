const express = require('express');
const { protect, adminOnly, techOrAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const faultRouter = express.Router();
const { createFaultReport, getFaultReports, updateFaultReport, deleteFaultReport } = require('../controllers/faultController');
faultRouter.post('/', upload.single('image'), createFaultReport);
faultRouter.get('/', protect, getFaultReports);
faultRouter.put('/:id', protect, techOrAdmin, updateFaultReport);
faultRouter.delete('/:id', protect, adminOnly, deleteFaultReport);

const aiRouter = express.Router();
const { getSuggestions } = require('../controllers/aiController');
aiRouter.post('/suggest', getSuggestions);

const dashboardRouter = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
dashboardRouter.get('/stats', protect, getDashboardStats);

const equipmentRouter = express.Router();
const { getEquipment, getEquipmentByQR, createEquipment, updateEquipment, deleteEquipment, getLaboratories, createLaboratory, deleteLaboratory } = require('../controllers/equipmentController');
equipmentRouter.get('/', getEquipment);
equipmentRouter.get('/qr/:qr', getEquipmentByQR);
equipmentRouter.post('/', protect, adminOnly, createEquipment);
equipmentRouter.put('/:id', protect, adminOnly, updateEquipment);
equipmentRouter.delete('/:id', protect, adminOnly, deleteEquipment);
equipmentRouter.get('/labs', protect, getLaboratories);
equipmentRouter.post('/labs', protect, adminOnly, createLaboratory);
equipmentRouter.delete('/labs/:id', protect, adminOnly, deleteLaboratory);

module.exports = {
  faultRouter,
  aiRouter,
  dashboardRouter,
  equipmentRouter
};
