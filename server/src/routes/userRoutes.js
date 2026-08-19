const express = require('express');
const router = express.Router();
const {
  getUsers,
  getAssignableUsers,
  getHierarchyTree,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  updatePresence,
} = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/auth');
const { checkHierarchyAccess } = require('../middlewares/hierarchy');

router.use(authenticateUser);

router.get('/', getUsers);
router.post('/', createUser);
router.get('/assignable', getAssignableUsers);
router.get('/hierarchy-tree', getHierarchyTree);
router.patch('/presence', updatePresence);
router.get('/:id', checkHierarchyAccess((req) => req.params.id), getUserById);
router.put('/:id', updateUser);
router.patch('/:id/disable', disableUser);

module.exports = router;
