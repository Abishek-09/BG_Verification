// =====================================================================
// Background Verification System - Person Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const personController = require('../controllers/person.controller');

router.get('/', personController.getAllPersons);
router.get('/verify/:query', personController.verifyPerson);
router.get('/:id', personController.getPersonById);
router.post('/', personController.createPerson);
router.delete('/:id', personController.deletePerson);

module.exports = router;
