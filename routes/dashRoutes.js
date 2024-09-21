const express = require('express');
const dashController = require('../controllers/dashController')
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware.requireAuth, dashController.dashboard_get)

router.get('/stock/:exchange/:ticker', authMiddleware.requireAuth, dashController.stock_page_get)

router.get('/update/:range', authMiddleware.requireAuth, dashController.update_dash_get)

router.get('/stock/update/:exchange/:ticker/:range', authMiddleware.requireAuth, dashController.update_stock_get)

module.exports = router;