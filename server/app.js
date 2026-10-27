const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Human review records ka model import karna
const Review = require("./models/Review");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Brand Rule Schema
const ruleSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    ruleType: {
      type: String,
      required: true,
      enum: ["prohibited_term", "required_phrase", "approved_fact"],
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "",
    },
    owner: {
      type: String,
      default: "",
    },
    reviewDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Rule = mongoose.model("Rule", ruleSchema);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "ProofBeforePost API is running!",
  });
});

// Get all brand rules
app.get("/api/rules", async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rules." });
  }
});

// Create a brand rule
app.post("/api/rules", async (req, res) => {
  try {
    const {
      brandName,
      ruleType,
      value,
      explanation,
      source,
      owner,
      reviewDate,
    } = req.body;

    if (!brandName?.trim() || !ruleType || !value?.trim()) {
      return res.status(400).json({
        message: "Brand name, rule type, and value are required.",
      });
    }

    const rule = await Rule.create({
      brandName,
      ruleType,
      value,
      explanation,
      source,
      owner,
      reviewDate: reviewDate || null,
    });

    res.status(201).json({
      message: "Brand rule created successfully!",
      rule,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create brand rule.",
    });
  }
});

// Audit draft content against saved brand rules
app.post("/api/audit", async (req, res) => {
  try {
    const { brandName, draft } = req.body;

    // Validate the incoming data
    if (!brandName?.trim() || !draft?.trim()) {
      return res.status(400).json({
        message: "Brand name and draft content are required.",
      });
    }

    // Fetch rules belonging to the selected brand
    const rules = await Rule.find({ brandName });

    const findings = [];

    // Check each saved rule against the draft
    for (const rule of rules) {
      const draftLower = draft.toLowerCase();
      const valueLower = rule.value.toLowerCase();

      if (rule.ruleType === "prohibited_term") {
        if (draftLower.includes(valueLower)) {
          findings.push({
            type: "rule_violation",
            severity: "high",
            matchedText: rule.value,
            rule: rule.value,
            reason: "This draft contains a prohibited term.",
            suggestedAction: "Remove or replace this term.",
            evidenceStatus: "configured_rule_match",
          });
        }
      }

      if (rule.ruleType === "required_phrase") {
        if (!draftLower.includes(valueLower)) {
          findings.push({
            type: "missing_required_phrase",
            severity: "medium",
            matchedText: null,
            rule: rule.value,
            reason: "A required phrase is missing from the draft.",
            suggestedAction: `Consider adding: "${rule.value}"`,
            evidenceStatus: "configured_rule_match",
          });
        }
      }

      if (rule.ruleType === "approved_fact") {
        if (!rule.source?.trim()) {
          findings.push({
            type: "needs_evidence",
            severity: "medium",
            matchedText: null,
            rule: rule.value,
            reason: "An approved fact has no recorded evidence source.",
            suggestedAction:
              "Add and verify an authoritative source before relying on this fact.",
            evidenceStatus: "missing_source",
          });
        }
      }
    }

    res.json({
      brandName,
      draft,
      findingsCount: findings.length,
      findings,
      message:
        findings.length === 0
          ? "No configured rule issues were detected. This does not guarantee factual accuracy."
          : "Review the findings before publishing.",
    });
  } catch (error) {
    console.error("Draft audit failed:", error.message);

    res.status(500).json({
      message: "Failed to audit draft content.",
    });
  }
});

// Create a review record after auditing a draft
app.post("/api/reviews", async (req, res) => {
  try {
    const { brandName, draft, findingsCount } = req.body;

    // Validate required input
    if (!brandName?.trim() || !draft?.trim()) {
      return res.status(400).json({
        message: "Brand name and draft are required.",
      });
    }

    // Validate the number of audit findings
    if (
      findingsCount !== undefined &&
      (!Number.isInteger(findingsCount) || findingsCount < 0)
    ) {
      return res.status(400).json({
        message: "Findings count must be a non-negative integer.",
      });
    }

    // Save a new review with Pending status
    const review = await Review.create({
      brandName: brandName.trim(),
      draft: draft.trim(),
      findingsCount: findingsCount ?? 0,
    });

    res.status(201).json({
      message: "Review created successfully.",
      review,
    });
  } catch (error) {
    console.error("Create review failed:", error.message);

    res.status(500).json({
      message: "Failed to create review.",
    });
  }
});

// Get saved review records
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Fetch reviews failed:", error.message);

    res.status(500).json({
      message: "Failed to fetch reviews.",
    });
  }
});

// Update a review decision
app.patch("/api/reviews/:id", async (req, res) => {
  try {
    const { status, reviewerNote } = req.body;

    // Accept only the supported review statuses
    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Changes Requested",
    ];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid review status.",
      });
    }

    if (reviewerNote !== undefined && typeof reviewerNote !== "string") {
      return res.status(400).json({
        message: "Reviewer note must be a string.",
      });
    }

    // Require at least one field to update
    if (status === undefined && reviewerNote === undefined) {
      return res.status(400).json({
        message: "Provide a status or reviewer note to update.",
      });
    }

    // Find the review and update only supplied fields
    const updates = {};

    if (status !== undefined) {
      updates.status = status;
    }

    if (reviewerNote !== undefined) {
      updates.reviewerNote = reviewerNote.trim();
    }

    // Return the updated document
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!review) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    res.json({
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    // Handle malformed MongoDB IDs
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid review ID.",
      });
    }

    console.error("Update review failed:", error.message);

    res.status(500).json({
      message: "Failed to update review.",
    });
  }
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
