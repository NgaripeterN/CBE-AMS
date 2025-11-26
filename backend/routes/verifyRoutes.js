const express = require('express');
const router = express.Router();
const { verifyCredential } = require('../controllers/verifyController');

router.post('/', verifyCredential);

module.exports = router;
