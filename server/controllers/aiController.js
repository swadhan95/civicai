const aiService = require('../services/aiService');
const storageService = require('../services/storageService');
const IssueCategory = require('../models/IssueCategory');
const Department = require('../models/Department');

// @desc    Analyze uploaded issue image with Real AI Vision abstraction
// @route   POST /api/ai/analyze
// @access  Public or Protected
exports.analyzeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image to analyze.'
      });
    }

    const { userHint } = req.body;
    const imageUrl = storageService.getUrl(req, req.file.filename);

    const aiResult = await aiService.analyzeIssueImage({
      filename: req.file.filename,
      originalname: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      userHint
    });

    // Lookup matching category from database
    let category = await IssueCategory.findOne({ slug: aiResult.categorySlug }).populate('defaultDepartment');
    if (!category && aiResult.detectedCategory) {
      category = await IssueCategory.findOne({ name: aiResult.detectedCategory }).populate('defaultDepartment');
    }

    // Lookup suggested department
    let department = null;
    if (category && category.defaultDepartment) {
      department = category.defaultDepartment;
    } else if (aiResult.suggestedDepartmentCode) {
      department = await Department.findOne({ code: aiResult.suggestedDepartmentCode });
    }

    // Determine confidence tier
    const confFloat = aiResult.confidenceFloat ?? (aiResult.confidence / 100);
    let confidenceTier = 'LOW';
    if (confFloat >= 0.85) {
      confidenceTier = 'HIGH';
    } else if (confFloat >= 0.65) {
      confidenceTier = 'MEDIUM';
    }

    res.json({
      success: true,
      data: {
        imageUrl,
        filename: req.file.filename,
        aiAnalysis: {
          mode: aiResult.mode || 'DEMO AI MODE',
          provider: aiResult.provider,
          issueDetected: aiResult.issueDetected,
          detectedCategory: aiResult.detectedCategory,
          categoryId: category ? category._id : null,
          categorySlug: aiResult.categorySlug,
          confidence: aiResult.confidence,
          confidenceFloat: confFloat,
          confidenceTier,
          severityTag: aiResult.severityTag || 'Moderate',
          description: aiResult.description,
          reasoningSummary: aiResult.reasoningSummary,
          isUsableImage: aiResult.isUsableImage !== false,
          suggestedPriority: category ? category.defaultPriority : aiResult.suggestedPriority,
          suggestedDepartment: department
            ? {
                id: department._id,
                name: department.name,
                code: department.code
              }
            : null,
          extractedFeatures: aiResult.extractedFeatures || []
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify issue resolution (Before vs After)
// @route   POST /api/ai/verify-resolution
// @access  Protected (Officer / Admin)
exports.verifyResolution = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload the resolution (AFTER) image.'
      });
    }

    const { beforeImage, categoryName } = req.body;
    const afterImageUrl = storageService.getUrl(req, req.file.filename);

    const verification = await aiService.verifyResolution({
      beforeImage,
      afterImage: afterImageUrl,
      categoryName
    });

    res.json({
      success: true,
      data: {
        afterImageUrl,
        verification
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI Vision status
// @route   GET /api/ai/status
// @access  Public
exports.getStatus = async (req, res, next) => {
  res.json({
    success: true,
    mode: aiService.mode,
    isRealVisionActive: aiService.isRealVisionActive,
    provider: aiService.isRealVisionActive ? 'Google Gemini 1.5 Flash (Multimodal)' : 'Offline Benchmark Engine'
  });
};

// @desc    Configure Gemini API Key dynamically
// @route   POST /api/ai/set-key
// @access  Public or Protected
exports.setApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Google Gemini API Key.' });
    }

    const trimmedKey = apiKey.trim();
    process.env.GEMINI_API_KEY = trimmedKey;

    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${trimmedKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${trimmedKey}\n`;
      }
      fs.writeFileSync(envPath, envContent);
    }

    aiService.reinitializeProvider(trimmedKey);

    res.json({
      success: true,
      message: 'Google Gemini Multimodal Vision AI activated successfully!',
      mode: aiService.mode,
      isRealVisionActive: aiService.isRealVisionActive
    });
  } catch (err) {
    next(err);
  }
};
