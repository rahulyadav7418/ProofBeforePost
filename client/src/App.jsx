import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://proofbeforepost.onrender.com/api/rules";

function App() {
  const [rules, setRules] = useState([]);
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
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [form, setForm] = useState({
    brandName: "StyleKart",
    ruleType: "prohibited_term",
    value: "",
    explanation: "",
    source: "",
    owner: "",
  });

  async function fetchRules() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load brand rules.");
      }

      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(
        "Unable to connect to the backend. Check whether your server is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRules();
    fetchReviews();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

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

  async function handleAudit() {
    setAuditing(true);
    setError("");
    setMessage("");
    setAuditResults(null);

    try {
      const response = await fetch("http://localhost:8080/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandName: "StyleKart",
          draft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Audit failed.");
      }

      setAuditResults(data);
    } catch (err) {
      setError(err.message || "Unable to audit the draft.");
    } finally {
      setAuditing(false);
    }
  }

  async function fetchReviews() {
    try {
      setLoadingReviews(true);
      setReviewError("");

      const response = await fetch("http://localhost:8080/api/reviews");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load review history.");
      }

      setReviews(data);
    } catch (err) {
      setReviewError(err.message || "Could not load review history.");
    } finally {
      setLoadingReviews(false);
    }
  }

  async function handleReviewDecision(status) {
    if (!auditResults) {
      setReviewError("Run an audit before submitting a review.");
      return;
    }

    try {
      setSavingReview(true);
      setReviewError("");
      setReviewMessage("");

      const createResponse = await fetch("http://localhost:8080/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandName: "StyleKart",
          draft,
          findingsCount: auditResults.findingsCount,
        }),
      });

      const createdReview = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createdReview.message || "Could not create review.");
      }

      const updateResponse = await fetch(
        `http://localhost:8080/api/reviews/${createdReview.review._id}`,
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

  return (
    <main className="app-container">
      {" "}
      <header className="topbar">
        {" "}
        <div className="brand">
          {" "}
          <div className="brand-icon">P</div>{" "}
          <div>
            {" "}
            <h1>ProofBeforePost</h1> <p>Evidence-first brand governance</p>{" "}
          </div>{" "}
        </div>
        <span className="status-badge">● Local workspace</span>
      </header>
      <section className="welcome">
        <p className="eyebrow">BRAND GOVERNANCE WORKSPACE</p>
        <h2>Make every claim accountable.</h2>
        <p>
          Manage brand rules and approved evidence before content goes public.
        </p>
      </section>
      <section className="panel audit-panel">
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

                <p>
                  <strong>Rule:</strong> {finding.rule}
                </p>

                <p>
                  <strong>Reason:</strong> {finding.reason}
                </p>

                <p>
                  <strong>Suggested action:</strong> {finding.suggestedAction}
                </p>
              </article>
            ))}

            <p className="audit-disclaimer">
              Automated checks can miss issues. Review findings before
              publishing.
            </p>

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
      <section className="dashboard">
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

        <div className="panel rules-panel">
          <div className="panel-heading">
            <div>
              <h3>Brand rulebook</h3>
              <p>Rules currently saved in your workspace.</p>
            </div>
            <span className="rule-count">{rules.length} rules</span>
          </div>

          <button className="refresh-button" type="button" onClick={fetchRules}>
            ↻ Refresh rules
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
    
      <section className="review-history">
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
                  {review.draft.length > 150
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
