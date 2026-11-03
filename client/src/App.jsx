import { useState, useEffect } from "react";
import "./App.css";
import { authenticateUser, getToken, logoutUser } from "./services/authService";
import Auth from "./components/Auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://proofbeforepost.onrender.com";

const API_URL = `${API_BASE_URL}/api/rules`;
const TOKEN_KEY = "proofbeforepost_token";
async function apiRequest(url, options = {}, authToken) {
  const headers = {
    ...options.headers,
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

function App() {
  const [rules, setRules] = useState([]);

  // Evidence management states
  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [evidenceError, setEvidenceError] = useState("");

  const [evidenceForm, setEvidenceForm] = useState({
    brandName: "StyleKart",
    claim: "",
    evidenceText: "",
    source: "",
    owner: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [auditResults, setAuditResults] = useState(null);
  const [auditing, setAuditing] = useState(false);

  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviews, setReviews] = useState([]);
  // Authentication states
  const [token, setToken] = useState(getToken());

  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loadingReviews, setLoadingReviews] = useState(false);

  const [form, setForm] = useState({
    brandName: "StyleKart",
    ruleType: "prohibited_term",
    value: "",
    explanation: "",
    source: "",
    owner: "",
  });

  const [menuOpen, setMenuOpen] = useState(false);

  async function handleAuthSubmit(event) {
    event.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await authenticateUser(authMode, authForm);

      if (authMode === "register") {
        setAuthMode("login");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
        setAuthError("Account created successfully. Please log in.");
        return;
      }

      setToken(data.token);
      setCurrentUser(data.user);
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Fetch brand rules
  async function fetchRules() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(API_URL, {}, token);

      if (!response.ok) {
        throw new Error("Could not load brand rules.");
      }

      const data = await response.json();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        "Unable to connect to the backend. Check whether your server is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch saved evidence records
  // Fetch evidence records
  const fetchEvidence = async () => {
    setLoadingEvidence(true);
    setEvidenceError("");

    try {
      const response = await apiRequest(
        `${API_BASE_URL}/api/evidence?brandName=StyleKart`,
        {},
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load evidence.");
      }

      setEvidenceRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setEvidenceError(err.message || "Failed to load evidence.");
    } finally {
      setLoadingEvidence(false);
    }
  };

  // Load application data
  // Restore logged-in user and load application data
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setCurrentUser(null);
        return;
      }

      try {
        const response = await apiRequest(
          `${API_BASE_URL}/api/auth/me`,
          {},
          token,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Session expired.");
        }

        setCurrentUser(data.user);

        fetchRules();
        fetchReviews();
        fetchEvidence();
      } catch (error) {
        logoutUser();
        setToken(null);
        setCurrentUser(null);
        setAuthError("Your session has expired. Please log in again.");
      }
    }

    restoreSession();
  }, [token]);

  // Handle brand rule form changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // Submit a new brand rule
  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await apiRequest(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save the rule.");
      }

      setMessage("Brand rule saved successfully!");

      setForm((previousForm) => ({
        ...previousForm,
        value: "",
        explanation: "",
        source: "",
        owner: "",
      }));

      await fetchRules();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  // Submit new evidence
  const handleEvidenceSubmit = async (event) => {
    event.preventDefault();

    setEvidenceMessage("");
    setEvidenceError("");

    try {
      const response = await apiRequest(
        `${API_BASE_URL}/api/evidence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(evidenceForm),
        },
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit evidence.");
      }

      setEvidenceMessage("Evidence submitted successfully.");

      setEvidenceForm({
        brandName: "StyleKart",
        claim: "",
        evidenceText: "",
        source: "",
        owner: "",
      });

      await fetchEvidence();
    } catch (err) {
      setEvidenceError(err.message || "Failed to submit evidence.");
    }
  };

  // Update evidence review status
  const handleEvidenceStatus = async (id, status) => {
    setEvidenceMessage("");
    setEvidenceError("");

    try {
      const response = await apiRequest(
        `${API_BASE_URL}/api/evidence/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update evidence status.");
      }

      setEvidenceMessage(`Evidence status updated to ${status}.`);

      await fetchEvidence();
    } catch (err) {
      setEvidenceError(err.message || "Failed to update evidence status.");
    }
  };

  // Run claim-to-evidence audit
  async function handleAudit() {
    if (auditing) return;

    if (!draft.trim()) {
      setError("Please enter draft content before running an audit.");
      return;
    }

    setAuditing(true);
    setError("");
    setMessage("");
    setAuditResults(null);
    setReviewStatus("");
    setReviewMessage("");
    setReviewError("");

    try {
      const response = await apiRequest(
        `${API_BASE_URL}/api/audit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandName: "StyleKart", draft }),
        },
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Audit failed.");
      }

      setAuditResults({
        ...data,
        findings: Array.isArray(data.findings) ? data.findings : [],
      });
    } catch (err) {
      setError(err.message || "Unable to audit the draft.");
    } finally {
      setAuditing(false);
    }
  }

  // Fetch review history
  async function fetchReviews() {
    try {
      setLoadingReviews(true);
      setReviewError("");

      const response = await apiRequest(
        `${API_BASE_URL}/api/reviews`,
        {},
        token,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load review history.");
      }

      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setReviewError(err.message || "Could not load review history.");
    } finally {
      setLoadingReviews(false);
    }
  }

  // Save human review decision
  async function handleReviewDecision(status) {
    if (!auditResults) {
      setReviewError("Run an audit before submitting a review.");
      return;
    }

    try {
      setSavingReview(true);
      setReviewError("");
      setReviewMessage("");

      // Create review
      const createResponse = await apiRequest(
        `${API_BASE_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brandName: "StyleKart",
            draft,
            findingsCount: auditResults.findingsCount,
          }),
        },
        token,
      );

      const createdReview = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createdReview.message || "Could not create review.");
      }

      if (!createdReview.review?._id) {
        throw new Error("Review was created but its ID was not returned.");
      }

      // Update review decision
      const updateResponse = await apiRequest(
        `${API_BASE_URL}/api/reviews/${createdReview.review._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            reviewerNote,
          }),
        },
        token,
      );

      const updatedReview = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(
          updatedReview.message || "Could not save review decision.",
        );
      }

      setReviewStatus(updatedReview.review.status);
      setReviewMessage(`Review saved: ${updatedReview.review.status}`);
      setReviewerNote("");

      await fetchReviews();
    } catch (err) {
      setReviewError(err.message || "Could not save review decision.");
    } finally {
      setSavingReview(false);
    }
  }

  if (!token || !currentUser) {
    return (
      <Auth
        mode={authMode}
        setMode={setAuthMode}
        form={authForm}
        setForm={setAuthForm}
        onSubmit={handleAuthSubmit}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <main className="app-container">
      <header className="topbar">
        <div className="header-left">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div className="brand">
            <div className="brand-icon">P</div>
            <div>
              <h1>ProofBeforePost</h1>
              <p>Evidence-first brand governance</p>
            </div>
          </div>
        </div>

        <div className="user-controls">
          <div className="user-info">
            <strong>{currentUser.name}</strong>
            <span className={`role-badge ${currentUser.role}`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() => {
              logoutUser();
              setToken(null);
              setCurrentUser(null);
              setAuthMode("login");
              setAuthForm({ name: "", email: "", password: "" });
            }}
          >
            Logout
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              className="menu-backdrop"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            />

            <nav className="main-nav" aria-label="Main navigation">
              <a href="#audit" onClick={() => setMenuOpen(false)}>
                Audit
              </a>
              <a href="#rulebook" onClick={() => setMenuOpen(false)}>
                Rulebook
              </a>
              <a href="#evidence" onClick={() => setMenuOpen(false)}>
                Evidence
              </a>
              <a href="#history" onClick={() => setMenuOpen(false)}>
                Review History
              </a>
            </nav>
          </>
        )}
      </header>

      <section className="welcome">
        <p className="eyebrow">BRAND GOVERNANCE WORKSPACE</p>
        <h2>Make every claim accountable.</h2>
        <p>
          Manage brand rules and approved evidence before content goes public.
        </p>
      </section>

      {/* Audit Section */}
      <section id="audit" className="panel audit-panel">
        <div className="panel-heading">
          <div>
            <h3>Audit your draft</h3>
            <p>Check content against StyleKart's configured brand rules.</p>
          </div>
          <span className="step-number">02</span>
        </div>

        <label htmlFor="draft">Draft content</label>

        <textarea
          id="draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Paste your marketing copy here..."
          rows="5"
        />

        <button
          className="primary-button"
          type="button"
          onClick={handleAudit}
          disabled={auditing || !draft.trim()}
        >
          {auditing ? "Checking draft..." : "Run Audit"}
        </button>

        {auditResults && (
          <div className="audit-results">
            <h4>Audit findings: {auditResults.findingsCount}</h4>

            <p>{auditResults.message}</p>

            {auditResults.findings.map((finding, index) => (
              <article className="finding-card" key={index}>
                <span className={`finding-severity ${finding.severity}`}>
                  {finding.severity}
                </span>

                <h4>{finding.type.replaceAll("_", " ")}</h4>

                <p>
                  <strong>Matched text:</strong>{" "}
                  {finding.matchedText || "No exact text match"}
                </p>

                {/* Claim-to-evidence information */}
                {finding.evidenceStatus && (
                  <div className="evidence-audit-details">
                    <p>
                      <strong>Evidence status:</strong>{" "}
                      <span
                        className={`evidence-status ${finding.evidenceStatus}`}
                      >
                        {finding.evidenceStatus}
                      </span>
                    </p>

                    {finding.matchPercentage !== undefined && (
                      <p>
                        <strong>Keyword match:</strong>{" "}
                        {finding.matchPercentage}%
                      </p>
                    )}

                    {finding.evidenceText && (
                      <p>
                        <strong>Supporting evidence:</strong>{" "}
                        {finding.evidenceText}
                      </p>
                    )}

                    {finding.relatedEvidence && (
                      <p>
                        <strong>Related evidence conditions:</strong>{" "}
                        {finding.relatedEvidence}
                      </p>
                    )}

                    {(() => {
                      const sources = [
                        ...(Array.isArray(finding.sources)
                          ? finding.sources
                          : []),
                        ...(finding.source ? [finding.source] : []),
                      ];

                      const uniqueSources = [
                        ...new Set(sources.filter(Boolean)),
                      ];

                      return (
                        <p>
                          <strong>Evidence sources:</strong>{" "}
                          {uniqueSources.length > 0 ? (
                            uniqueSources.map((source, sourceIndex) => (
                              <span key={source}>
                                {sourceIndex > 0 && " · "}
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View source {sourceIndex + 1}
                                </a>
                              </span>
                            ))
                          ) : (
                            <span>Source not provided</span>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {finding.rule && (
                  <p>
                    <strong>Rule:</strong> {finding.rule}
                  </p>
                )}

                <p>
                  <strong>Reason:</strong> {finding.reason}
                </p>

                {finding.suggestedAction && (
                  <p>
                    <strong>Suggested action:</strong> {finding.suggestedAction}
                  </p>
                )}
              </article>
            ))}

            <p className="audit-disclaimer">
              Automated checks can miss issues. Review findings before
              publishing.
            </p>

            {/* Human Review */}
            <div className="human-review">
              <h4>Human review decision</h4>

              <p>
                Review the findings before deciding whether this draft is ready.
              </p>

              <label htmlFor="reviewerNote">Reviewer note</label>

              <textarea
                id="reviewerNote"
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                placeholder="Explain your decision or required changes..."
                rows="3"
              />

              {["admin", "reviewer"].includes(currentUser?.role) && (
                <div className="review-actions">
                  <button
                    type="button"
                    disabled={savingReview}
                    onClick={() => handleReviewDecision("Approved")}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={savingReview}
                    onClick={() => handleReviewDecision("Rejected")}
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={savingReview}
                    onClick={() => handleReviewDecision("Changes Requested")}
                  >
                    Request Changes
                  </button>
                </div>
              )}

              {savingReview && <p>Saving review...</p>}

              {reviewStatus && <p>Current decision: {reviewStatus}</p>}

              {reviewMessage && (
                <p className="success-message">{reviewMessage}</p>
              )}

              {reviewError && <p className="error-message">{reviewError}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Brand Rules Dashboard */}
      <section className="dashboard">
        {currentUser?.role === "admin" && (
          <div className="panel form-panel">
            <div className="panel-heading">
              <div>
                <h3>Create a brand rule</h3>
                <p>Define what your content must follow.</p>
              </div>
              <span className="step-number">01</span>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="brandName">Brand name *</label>
              <input
                id="brandName"
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                required
                placeholder="e.g. StyleKart"
              />

              <label htmlFor="ruleType">Rule type *</label>
              <select
                id="ruleType"
                name="ruleType"
                value={form.ruleType}
                onChange={handleChange}
                required
              >
                <option value="prohibited_term">Prohibited term</option>
                <option value="required_phrase">Required phrase</option>
                <option value="approved_fact">Approved fact / evidence</option>
              </select>

              <label htmlFor="value">Rule or approved fact *</label>
              <textarea
                id="value"
                name="value"
                value={form.value}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Enter the phrase, term, or approved fact"
              />

              <label htmlFor="explanation">Explanation</label>
              <textarea
                id="explanation"
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows="2"
                placeholder="Why does this rule matter?"
              />

              <div className="form-row">
                <div>
                  <label htmlFor="source">Evidence source</label>
                  <input
                    id="source"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    placeholder="Policy or source URL"
                  />
                </div>

                <div>
                  <label htmlFor="owner">Accountable owner</label>
                  <input
                    id="owner"
                    name="owner"
                    value={form.owner}
                    onChange={handleChange}
                    placeholder="e.g. Marketing team"
                  />
                </div>
              </div>

              <button className="primary-button" type="submit">
                + Save brand rule
              </button>
            </form>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
          </div>
        )}

        {/* Rulebook */}
        <div id="rulebook" className="panel rules-panel">
          <div className="panel-heading">
            <div>
              <h3>Brand rulebook</h3>
              <p>Rules currently saved in your workspace.</p>
            </div>
            <span className="rule-count">{rules.length} rules</span>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={fetchRules}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh rules"}
          </button>

          {loading && <p className="empty-state">Loading rules...</p>}

          {!loading && rules.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h4>No rules yet</h4>
              <p>Create your first rule using the form.</p>
            </div>
          )}

          <div className="rules-list">
            {rules.map((rule) => (
              <article className="rule-card" key={rule._id}>
                <div className="rule-card-top">
                  <span className={`rule-tag ${rule.ruleType}`}>
                    {rule.ruleType.replaceAll("_", " ")}
                  </span>
                  <span className="saved-dot">● Saved</span>
                </div>

                <h4>{rule.value}</h4>
                <p className="rule-brand">{rule.brandName}</p>

                {rule.explanation && <p>{rule.explanation}</p>}

                <div className="rule-meta">
                  <span>Source: {rule.source || "Not provided"}</span>
                  <span>Owner: {rule.owner || "Not assigned"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence Management */}
      <section id="evidence" className="evidence-section">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Evidence Management</h3>
              <p>Submit and review supporting evidence for brand claims.</p>
            </div>
            <span className="step-number">03</span>
          </div>

          {["admin", "reviewer"].includes(currentUser?.role) && (
            <form className="evidence-form" onSubmit={handleEvidenceSubmit}>
              <label htmlFor="evidenceBrandName">Brand name *</label>
              <input
                id="evidenceBrandName"
                type="text"
                value={evidenceForm.brandName}
                onChange={(event) =>
                  setEvidenceForm({
                    ...evidenceForm,
                    brandName: event.target.value,
                  })
                }
                required
              />

              <label htmlFor="evidenceClaim">Claim *</label>
              <textarea
                id="evidenceClaim"
                rows="2"
                placeholder="Enter the claim made by the brand"
                value={evidenceForm.claim}
                onChange={(event) =>
                  setEvidenceForm({
                    ...evidenceForm,
                    claim: event.target.value,
                  })
                }
                required
              />

              <label htmlFor="evidenceText">Supporting evidence *</label>
              <textarea
                id="evidenceText"
                rows="3"
                placeholder="Explain the evidence supporting this claim"
                value={evidenceForm.evidenceText}
                onChange={(event) =>
                  setEvidenceForm({
                    ...evidenceForm,
                    evidenceText: event.target.value,
                  })
                }
                required
              />

              <label htmlFor="evidenceSource">
                Evidence source URL (optional)
              </label>
              <input
                id="evidenceSource"
                type="url"
                placeholder="https://example.com/policy"
                value={evidenceForm.source}
                onChange={(event) =>
                  setEvidenceForm({
                    ...evidenceForm,
                    source: event.target.value,
                  })
                }
              />

              <label htmlFor="evidenceOwner">Accountable owner</label>
              <input
                id="evidenceOwner"
                type="text"
                placeholder="Marketing Team"
                value={evidenceForm.owner}
                onChange={(event) =>
                  setEvidenceForm({
                    ...evidenceForm,
                    owner: event.target.value,
                  })
                }
              />

              <button type="submit" className="primary-button">
                + Submit Evidence
              </button>
            </form>
          )}

          {evidenceMessage && (
            <p className="success-message">{evidenceMessage}</p>
          )}

          {evidenceError && <p className="error-message">{evidenceError}</p>}

          <div className="panel-heading">
            <div>
              <h3>Saved Evidence</h3>
              <p>Review the supporting records submitted for StyleKart.</p>
            </div>
            <span className="rule-count">{evidenceRecords.length} records</span>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={fetchEvidence}
            disabled={loadingEvidence}
          >
            {loadingEvidence ? "Loading..." : "↻ Refresh evidence"}
          </button>

          {loadingEvidence && <p>Loading evidence records...</p>}

          {!loadingEvidence && evidenceRecords.length === 0 && (
            <div className="empty-state">
              <h4>No evidence records yet</h4>
              <p>Submit supporting evidence using the form above.</p>
            </div>
          )}

          {!loadingEvidence && evidenceRecords.length > 0 && (
            <div className="evidence-groups">
              {["Approved", "Pending", "Rejected"].map((status) => {
                const groupedEvidence = evidenceRecords.filter(
                  (evidence) => evidence.status === status,
                );

                return (
                  <section className="evidence-group" key={status}>
                    <div className="panel-heading">
                      <div>
                        <h4>{status} Evidence</h4>
                        <p>
                          {status === "Approved"
                            ? "Human-reviewed evidence available for audit checks."
                            : status === "Pending"
                              ? "Evidence awaiting human review. Not authoritative."
                              : "Rejected evidence. Not available as approved support."}
                        </p>
                      </div>

                      <span className="rule-count">
                        {groupedEvidence.length} records
                      </span>
                    </div>

                    {groupedEvidence.length === 0 ? (
                      <p className="empty-state">
                        No {status.toLowerCase()} evidence records.
                      </p>
                    ) : (
                      <div className="evidence-list">
                        {groupedEvidence.map((evidence) => (
                          <article className="evidence-card" key={evidence._id}>
                            <div className="rule-card-top">
                              <span
                                className={`evidence-status ${evidence.status}`}
                              >
                                {evidence.status}
                              </span>
                              <span className="saved-dot">
                                {evidence.brandName}
                              </span>
                            </div>

                            <h4>{evidence.claim}</h4>

                            <p>{evidence.evidenceText}</p>

                            <div className="evidence-meta">
                              <p>
                                <strong>Source:</strong>{" "}
                                {evidence.source ? (
                                  <a
                                    href={evidence.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {evidence.source}
                                  </a>
                                ) : (
                                  <span>Source not provided</span>
                                )}
                              </p>

                              {!evidence.source && (
                                <p className="error-message">
                                  Source documentation is not available. Verify
                                  independently before relying on this record.
                                </p>
                              )}

                              <p>
                                <strong>Owner:</strong>{" "}
                                {evidence.owner || "Not assigned"}
                              </p>
                            </div>

                            {["admin", "reviewer"].includes(
                              currentUser?.role,
                            ) && (
                              <div className="evidence-actions">
                                <button
                                  type="button"
                                  disabled={evidence.status === "Approved"}
                                  onClick={() =>
                                    handleEvidenceStatus(
                                      evidence._id,
                                      "Approved",
                                    )
                                  }
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={evidence.status === "Rejected"}
                                  onClick={() =>
                                    handleEvidenceStatus(
                                      evidence._id,
                                      "Rejected",
                                    )
                                  }
                                >
                                  Reject
                                </button>

                                <button
                                  type="button"
                                  disabled={evidence.status === "Pending"}
                                  onClick={() =>
                                    handleEvidenceStatus(
                                      evidence._id,
                                      "Pending",
                                    )
                                  }
                                >
                                  Set Pending
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Review History */}
      <section id="history" className="review-history">
        <h2>Review History</h2>
        <p>Previously submitted reviews and their decisions.</p>

        {loadingReviews && <p>Loading review history...</p>}

        {reviewError && <p className="error-message">{reviewError}</p>}

        {!loadingReviews && !reviewError && reviews.length === 0 && (
          <p>
            No reviews yet. Complete an audit and submit a review to see it
            here.
          </p>
        )}

        {reviews.length > 0 && (
          <div className="review-history-list">
            {reviews.map((review) => (
              <article className="review-history-card" key={review._id}>
                <h3>{review.brandName}</h3>

                <p>
                  <strong>Status:</strong> {review.status}
                </p>

                <p>
                  <strong>Findings:</strong> {review.findingsCount}
                </p>

                <p>
                  <strong>Draft:</strong>{" "}
                  {(review.draft || "").length > 150
                    ? `${review.draft.slice(0, 150)}...`
                    : review.draft}
                </p>

                {review.reviewerNote && (
                  <p>
                    <strong>Reviewer note:</strong> {review.reviewerNote}
                  </p>
                )}

                <p className="review-date">
                  <strong>Created:</strong>{" "}
                  {new Date(review.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        ProofBeforePost · Findings support human review; they do not guarantee
        that content is accurate.
      </footer>
    </main>
  );
}

export default App;
