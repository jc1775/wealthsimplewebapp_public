const express = require('express');
const authController = require('../controllers/authController')
const router = express.Router();

router.get('/signin', authController.sign_in_get)

router.post('/signin', authController.sign_in_post)

router.get('/signup', authController.sign_up_get)


module.exports = router;