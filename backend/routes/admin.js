const express = require("express");
const router = express.Router();
const adminContriller = require("../Controllers/adminContriller");

// Admin login
router.post("/login", adminContriller.loginAdmin);
// Dev/debug endpoints
router.get('/ping', adminContriller.ping);
router.post('/check', adminContriller.checkCredentials);

// Dashboard data
router.get("/dashboard", adminContriller.getDashboardData);

// Messages endpoints for admin
router.get('/messages', adminContriller.getMessages);
router.put('/messages/:id/read', adminContriller.markMessageRead);

module.exports = router;