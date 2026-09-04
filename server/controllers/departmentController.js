const Department = require('../models/Department');

// @desc    Get all active departments
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, contactEmail } = req.body;
    const department = await Department.create({
      name,
      code: code ? code.toUpperCase() : name.replace(/\s+/g, '_').toUpperCase(),
      description,
      contactEmail
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete department (soft delete / active: false)
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
