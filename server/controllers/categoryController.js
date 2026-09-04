const IssueCategory = require('../models/IssueCategory');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await IssueCategory.find({ active: true })
      .populate('defaultDepartment', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, defaultDepartment, defaultPriority, keywords, icon } = req.body;
    const category = await IssueCategory.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      defaultDepartment,
      defaultPriority: defaultPriority || 'MEDIUM',
      keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map((k) => k.trim()) : []),
      icon: icon || 'AlertCircle'
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await IssueCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('defaultDepartment', 'name code');
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category (soft delete / active: false)
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await IssueCategory.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
