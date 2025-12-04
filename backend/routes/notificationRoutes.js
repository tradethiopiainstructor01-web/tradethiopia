const express = require("express");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController.js");

const router = express.Router();

router.get("/", getNotifications);
router.put("/:id", markAsRead);
router.put("/mark-all-read", markAllAsRead);

module.exports = router;