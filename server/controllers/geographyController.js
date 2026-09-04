const geographyService = require('../services/geographyService');
const Area = require('../models/Area');

// @desc    Get root geographic regions (State & top-level Parliaments/Districts)
// @route   GET /api/geography/root
// @access  Private (Citizen/Officer/Admin)
exports.getRootRegions = async (req, res, next) => {
  try {
    const data = await geographyService.getRootRegions();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single region metadata and breadcrumb lineage
// @route   GET /api/geography/:id
// @access  Private
exports.getRegionById = async (req, res, next) => {
  try {
    const { region, lineage } = await geographyService.getRegionLineage(req.params.id);
    if (!region) {
      return res.status(404).json({ success: false, message: 'Geographic region not found.' });
    }
    res.json({ success: true, data: { region, lineage } });
  } catch (err) {
    next(err);
  }
};

// @desc    Get child regions with dynamically aggregated statistics
// @route   GET /api/geography/:id/children
// @access  Private
exports.getChildRegions = async (req, res, next) => {
  try {
    const children = await geographyService.getChildRegionsWithStatistics(req.params.id, req.query);
    res.json({ success: true, count: children.length, data: children });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comprehensive geographic intelligence statistics for a region
// @route   GET /api/geography/:id/statistics
// @access  Private
exports.getRegionStatistics = async (req, res, next) => {
  try {
    const stats = await geographyService.getRegionStatistics(req.params.id, req.query);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// @desc    Get cross-tabulation matrix (Department vs Area OR Category vs Area)
// @route   GET /api/geography/:id/matrix
// @access  Private
exports.getRegionMatrix = async (req, res, next) => {
  try {
    const { matrixType } = req.query;
    const matrix = await geographyService.getRegionMatrix(req.params.id, matrixType, req.query);
    res.json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
};

// @desc    Get filterable paginated complaints for a geographic region
// @route   GET /api/geography/:id/problems
// @access  Private
exports.getRegionProblems = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await geographyService.getRegionProblems(req.params.id, { page, limit }, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// @desc    Search geographic entities
// @route   GET /api/geography/search
// @access  Private
exports.searchRegions = async (req, res, next) => {
  try {
    const { q } = req.query;
    const regions = await geographyService.searchRegions(q);
    res.json({ success: true, count: regions.length, data: regions });
  } catch (err) {
    next(err);
  }
};
