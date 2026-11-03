const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Review = require("./models/Review");
const Evidence = require("./models/Evidence");

// Authentication dependencies
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { authenticateToken, authorizeRoles } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ==========================================
// BRAND RULE SCHEMA
// ==========================================

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

// ==========================================
// CLAIM MATCHING HELPER FUNCTIONS
// ==========================================

// Common words that do not help identify a claim category
const stopWords = new Set([
  "is",
  "are",
  "the",
  "a",
  "an",
  "on",
  "in",
  "of",
  "to",
  "only",
  "available",
  "above",
  "within",
  "when",
  "their",
  "order",
  "orders",
  "customers",
  "customer",
  "free",
  "for",
  "and",
  "with",
  "from",
  "this",
  "that",
  "all",
  "receive",
  "receives",
  "will",
  "be",
  "can",
]);

// Extract meaningful words from text
function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s₹]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

// Extract numeric values from text
function extractNumbers(text) {
  return text.match(/\d+(?:\.\d+)?/g) || [];
}

// Find sentences that share at least two meaningful words with a claim
function getClaimCategory(text) {
  const lowerText = text.toLowerCase();

  // Check returns first because a returns sentence may mention delivery.
  if (/\b(returns?|refunds?|exchanges?)\b/.test(lowerText)) {
    return "returns";
  }

  if (/\b(delivery|deliveries|shipping|shipment)\b/.test(lowerText)) {
    return "delivery";
  }

  return "other";
}

function getRelevantDraftText(claim, draft) {
  const claimCategory = getClaimCategory(claim);

  const claimWords = new Set(normalizeWords(claim));

  const sentences = draft
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences
    .filter((sentence) => {
      const draftCategory = getClaimCategory(sentence);

      // Match delivery claims only with delivery sentences,
      // and returns claims only with returns sentences.
      if (claimCategory !== "other" && draftCategory !== claimCategory) {
        return false;
      }

      const draftWords = new Set(normalizeWords(sentence));

      const matchedWords = [...claimWords].filter((word) =>
        draftWords.has(word),
      );

      // One matching word is enough for a recognized category.
      return claimCategory !== "other"
        ? matchedWords.length >= 1
        : matchedWords.length >= 2;
    })
    .join(" ");
}

function getRelevantDraftSentences(claim, draft) {
  const claimCategory = getClaimCategory(claim);
  const claimWords = new Set(normalizeWords(claim));

  return draft
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => {
      const draftCategory = getClaimCategory(sentence);

      if (claimCategory !== "other" && draftCategory !== claimCategory) {
        return false;
      }

      const draftWords = new Set(normalizeWords(sentence));

      const matchedWords = [...claimWords].filter((word) =>
        draftWords.has(word),
      );

      return claimCategory !== "other"
        ? matchedWords.length >= 1
        : matchedWords.length >= 2;
    });
}

// Calculate similarity using meaningful words
function calculateClaimSimilarity(claim, draft) {
  const claimWords = [...new Set(normalizeWords(claim))];
  const draftWords = new Set(normalizeWords(draft));

  if (claimWords.length === 0) {
    return 0;
  }

  const matchedWords = claimWords.filter((word) => draftWords.has(word));

  return matchedWords.length / claimWords.length;
}

// Create a category key for grouping related evidence
function createConceptKey(claim) {
  const withoutNumbers = claim.replace(/\d+(?:\.\d+)?/g, " ");

  return [...new Set(normalizeWords(withoutNumbers))].sort().join(" ");
}

function createDisplayLabel(claim) {
  return claim
    .replace(/\d+(?:\.\d+)?/g, "")
    .replace(/\b(?:above|within)\b.*$/i, "")
    .replace(/\bon orders\b.*$/i, "")
    .replace(/\b(?:is available|are available|available)\b/gi, "")
    .replace(/[₹.,]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "ProofBeforePost API is running!",
  });
});

// ==========================================
// BRAND RULE APIs
// ==========================================

// Get all brand rules
app.get("/api/rules", authenticateToken, async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    console.error("Fetch rules failed:", error.message);

    res.status(500).json({
      message: "Failed to fetch rules.",
    });
  }
});

// Create a brand rule
app.post(
  "/api/rules",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
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
        brandName: brandName.trim(),
        ruleType,
        value: value.trim(),
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

      console.error("Create rule failed:", error.message);

      res.status(500).json({
        message: "Failed to create brand rule.",
      });
    }
  },
);

// ==========================================
// DRAFT AUDIT API
// ==========================================

app.post("/api/audit", authenticateToken, async (req, res) => {
  try {
    const { brandName, draft } = req.body;

    if (!brandName?.trim() || !draft?.trim()) {
      return res.status(400).json({
        message: "Brand name and draft content are required.",
      });
    }

    // Fetch rules and evidence for this brand
    const rules = await Rule.find({
      brandName: brandName.trim(),
    });

    const evidenceRecords = await Evidence.find({
      brandName: brandName.trim(),
    });

    const findings = [];
    const draftLower = draft.toLowerCase();

    // --------------------------------------
    // EXISTING BRAND RULE CHECKS
    // --------------------------------------

    for (const rule of rules) {
      const valueLower = rule.value.toLowerCase();

      // Check prohibited terms
      if (
        rule.ruleType === "prohibited_term" &&
        draftLower.includes(valueLower)
      ) {
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

      // Check required phrases
      if (
        rule.ruleType === "required_phrase" &&
        !draftLower.includes(valueLower)
      ) {
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

    // --------------------------------------
    // CLAIM-TO-EVIDENCE CONSISTENCY CHECK
    // --------------------------------------

    const missingConditionGroups = new Map();

    for (const evidence of evidenceRecords) {
      // Only approved evidence can establish an authoritative claim condition.
      if (evidence.status !== "Approved") {
        continue;
      }

      const relevantDraftText = getRelevantDraftText(evidence.claim, draft);

      if (!relevantDraftText) continue;

      const similarity = calculateClaimSimilarity(
        evidence.claim,
        relevantDraftText,
      );

      if (similarity < 0.5) continue;

      const claimNumbers = extractNumbers(evidence.claim);

      const relevantSentences = getRelevantDraftSentences(
        evidence.claim,
        draft,
      );

      const sentenceNumbers = relevantSentences.map((sentence) => ({
        sentence,
        numbers: extractNumbers(sentence),
      }));

      // Check whether a relevant sentence is missing the numeric condition
      const missingNumericCondition =
        claimNumbers.length > 0 &&
        sentenceNumbers.some(({ numbers }) => numbers.length === 0);

      // Check whether a relevant sentence uses a conflicting number
      const conflictingNumericCondition =
        claimNumbers.length > 0 &&
        sentenceNumbers.some(
          ({ numbers }) =>
            numbers.length > 0 &&
            !claimNumbers.every((number) => numbers.includes(number)),
        );

      // ----------------------------------
      // MISSING NUMERIC CONDITION
      // ----------------------------------

      if (missingNumericCondition) {
        const conceptKey = createConceptKey(evidence.claim);

        if (!conceptKey) {
          continue;
        }

        if (!missingConditionGroups.has(conceptKey)) {
          missingConditionGroups.set(conceptKey, {
            matchedText: createDisplayLabel(evidence.claim),
            conditions: [],
          });
        }

        missingConditionGroups.get(conceptKey).conditions.push({
          claim: evidence.claim,
          status: evidence.status,
          source: evidence.source,
        });

        continue;
      }

      // ----------------------------------
      // CONFLICTING NUMERIC CONDITION
      // ----------------------------------

      if (conflictingNumericCondition) {
        findings.push({
          type: "condition_conflict",
          severity: "high",
          matchedText: evidence.claim,
          reason:
            "The numeric condition in the draft conflicts with the saved evidence claim.",
          evidenceStatus: evidence.status.toLowerCase(),
          source: evidence.source,
          evidenceText: evidence.evidenceText,
          suggestedAction:
            "Check the correct numeric condition with the evidence owner before publishing.",
        });

        continue;
      }

      // ----------------------------------
      // MATCHING EVIDENCE
      // ----------------------------------

      const isExactMatch = draftLower.includes(evidence.claim.toLowerCase());

      if (evidence.status === "Approved") {
        findings.push({
          type: isExactMatch ? "claim_evidence_match" : "potential_claim_match",
          severity: "info",
          matchedText: evidence.claim,
          matchPercentage: Math.round(similarity * 100),
          reason: isExactMatch
            ? "The saved claim appears in the draft and has been approved by a reviewer."
            : "The draft contains wording similar to a reviewer-approved claim. Manual verification is required.",
          evidenceStatus: "approved",
          source: evidence.source,
          evidenceText: evidence.evidenceText,
          suggestedAction:
            "Confirm that the draft wording does not change the meaning of the approved claim.",
        });
      } else {
        findings.push({
          type: "unsupported_claim",
          severity: "high",
          matchedText: evidence.claim,
          matchPercentage: Math.round(similarity * 100),
          reason: `The matching evidence record is currently ${evidence.status.toLowerCase()}.`,
          suggestedAction:
            "Ask a reviewer to verify the evidence before publishing.",
          evidenceStatus: evidence.status.toLowerCase(),
          source: evidence.source,
          evidenceText: evidence.evidenceText,
        });
      }
    }

    // --------------------------------------
    // ADD MISSING-CONDITION FINDINGS
    // --------------------------------------

    for (const group of missingConditionGroups.values()) {
      const sources = [
        ...new Set(group.conditions.map((item) => item.source).filter(Boolean)),
      ];

      findings.push({
        type: "missing_condition",
        severity: "high",
        matchedText: group.matchedText,
        reason:
          "The draft makes a broad claim but omits the numeric eligibility condition specified in the saved evidence records.",
        evidenceStatus: "condition_missing",
        relatedEvidence: group.conditions
          .map((item) => `${item.claim} (${item.status})`)
          .join("; "),
        sources,
        suggestedAction:
          "Specify the correct eligibility condition and ask a reviewer to verify it before publishing.",
      });
    }

    // --------------------------------------
    // AUDIT RESPONSE
    // --------------------------------------

    res.json({
      brandName,
      draft,
      findingsCount: findings.length,
      findings,
      message:
        findings.length === 0
          ? "No configured rule issues or matching saved claims were detected. This does not guarantee factual accuracy."
          : "Review the findings before publishing.",
    });
  } catch (error) {
    console.error("Draft audit failed:", error.message);

    res.status(500).json({
      message: "Failed to audit draft content.",
    });
  }
});

// ==========================================
// REVIEW APIs
// ==========================================

// Create a review record after auditing a draft
app.post(
  "/api/reviews",
  authenticateToken,
  authorizeRoles("reviewer", "admin"),
  async (req, res) => {
    try {
      const { brandName, draft, findingsCount } = req.body;

      if (!brandName?.trim() || !draft?.trim()) {
        return res.status(400).json({
          message: "Brand name and draft are required.",
        });
      }

      if (
        findingsCount !== undefined &&
        (!Number.isInteger(findingsCount) || findingsCount < 0)
      ) {
        return res.status(400).json({
          message: "Findings count must be a non-negative integer.",
        });
      }

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
  },
);

// Get saved review records
app.get("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find().sort({
      createdAt: -1,
    });

    res.json(reviews);
  } catch (error) {
    console.error("Fetch reviews failed:", error.message);

    res.status(500).json({
      message: "Failed to fetch reviews.",
    });
  }
});

// Update a review decision
app.patch(
  "/api/reviews/:id",
  authenticateToken,
  authorizeRoles("reviewer", "admin"),
  async (req, res) => {
    try {
      const { status, reviewerNote } = req.body;

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

      if (status === undefined && reviewerNote === undefined) {
        return res.status(400).json({
          message: "Provide a status or reviewer note to update.",
        });
      }

      const updates = {};

      if (status !== undefined) {
        updates.status = status;
      }

      if (reviewerNote !== undefined) {
        updates.reviewerNote = reviewerNote.trim();
      }

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
  },
);

// ==========================================
// EVIDENCE APIs
// ==========================================

// GET: Retrieve saved evidence
app.get("/api/evidence", authenticateToken, async (req, res) => {
  try {
    const { brandName } = req.query;

    const filter = brandName ? { brandName: brandName.trim() } : {};

    const evidence = await Evidence.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json(evidence);
  } catch (error) {
    console.error("Fetch evidence error:", error.message);

    res.status(500).json({
      message: "Failed to retrieve evidence.",
    });
  }
});

// POST: Save new evidence
app.post(
  "/api/evidence",
  authenticateToken,
  authorizeRoles("reviewer", "admin"),
  async (req, res) => {
    try {
      const { brandName, claim, evidenceText, source, owner } = req.body;

      if (!brandName?.trim() || !claim?.trim() || !evidenceText?.trim()) {
        return res.status(400).json({
          message: "Brand name, claim and evidence text are required.",
        });
      }

      const newEvidence = await Evidence.create({
        brandName: brandName.trim(),
        claim: claim.trim(),
        evidenceText: evidenceText.trim(),
        source: source?.trim() || "",
        owner: owner?.trim() || "",
        status: "Pending",
      });

      res.status(201).json({
        message: "Evidence submitted successfully.",
        evidence: newEvidence,
      });
    } catch (error) {
      console.error("Save evidence error:", error.message);

      res.status(500).json({
        message: "Failed to save evidence.",
      });
    }
  },
);

// PATCH: Update evidence details or review status
app.patch(
  "/api/evidence/:id",
  authenticateToken,
  authorizeRoles("reviewer", "admin"),
  async (req, res) => {
    try {
      const { status, claim, evidenceText, source, owner } = req.body;

      const updates = {};

      if (status !== undefined) {
        const allowedStatuses = ["Pending", "Approved", "Rejected"];

        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            message: "Invalid evidence status.",
          });
        }

        updates.status = status;
      }

      if (claim !== undefined) {
        if (typeof claim !== "string" || !claim.trim()) {
          return res.status(400).json({
            message: "Claim must be a non-empty string.",
          });
        }

        updates.claim = claim.trim();
      }

      if (evidenceText !== undefined) {
        if (typeof evidenceText !== "string" || !evidenceText.trim()) {
          return res.status(400).json({
            message: "Evidence text must be a non-empty string.",
          });
        }

        updates.evidenceText = evidenceText.trim();
      }

      if (source !== undefined) {
        if (typeof source !== "string") {
          return res.status(400).json({
            message: "Source must be a string.",
          });
        }

        updates.source = source.trim();
      }

      if (owner !== undefined) {
        if (typeof owner !== "string") {
          return res.status(400).json({
            message: "Owner must be a string.",
          });
        }

        updates.owner = owner.trim();
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          message: "No valid fields provided for update.",
        });
      }

      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!evidence) {
        return res.status(404).json({
          message: "Evidence not found.",
        });
      }

      res.json({
        message: "Evidence updated successfully.",
        evidence,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid evidence ID.",
        });
      }

      console.error("Update evidence failed:", error.message);

      res.status(500).json({
        message: "Failed to update evidence.",
      });
    }
  },
);

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "viewer",
    });

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration failed:", error.message);

    res.status(500).json({
      message: "Unable to create account.",
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

// GET CURRENT USER
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve user.",
    });
  }
});

// ==========================================
// ADMIN: UPDATE USER ROLE
// ==========================================

app.patch(
  "/api/admin/users/:id/role",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      const allowedRoles = ["viewer", "reviewer", "admin"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role.",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role } },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      res.json({
        message: "User role updated successfully.",
        user,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      console.error("Role update failed:", error.message);

      res.status(500).json({
        message: "Failed to update user role.",
      });
    }
  },
);

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from environment variables.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment variables.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Create initial admin account if it does not exist
    if (
      process.env.ADMIN_NAME &&
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD
    ) {
      const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();

      const existingAdmin = await User.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(
          process.env.ADMIN_PASSWORD,
          12,
        );

        await User.create({
          name: process.env.ADMIN_NAME,
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
        });

        console.log("Initial admin account created successfully!");
      } else {
        console.log("Admin account already exists.");
      }
    }

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
