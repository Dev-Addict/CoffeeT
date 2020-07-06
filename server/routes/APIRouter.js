const express = require('express');

const errorController = require('../controllers/errorController');

const router = express.Router({mergeParams: true});

router.use(errorController);

module.exports = router;