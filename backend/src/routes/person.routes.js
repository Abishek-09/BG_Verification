// =====================================================================
// Background Verification System - Person Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const personController = require('../controllers/person.controller');

router.get('/', personController.getAllPersons);
router.get('/verify/:query', personController.verifyPerson);
router.get('/:id', personController.getPersonById);
router.post('/work-mode', personController.updateEmployeeWorkMode);
router.put('/work-mode', personController.updateEmployeeWorkMode);
router.put('/:id/work-mode', personController.updateEmployeeWorkMode);
router.post('/', personController.createPerson);
router.post('/:id/deactivate', personController.deactivateEmployee);
router.delete('/:id', personController.deletePerson);

module.exports = router;
