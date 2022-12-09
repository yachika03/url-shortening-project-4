const express = require('express');
const router = express.Router();
const { shortenURL, getUrl, deleteUrl } = require("../controllers/urlController.js")



router.post("/url/shorten", shortenURL)
router.get("/:urlCode", getUrl)
router.put("/:urlCode", deleteUrl)



module.exports = router;