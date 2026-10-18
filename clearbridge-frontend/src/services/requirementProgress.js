import { loadChecklist, saveEvidence } from "./checklistStore.js";
const STORAGE_KEY = "bizbridge-requirement-progress";

export function getRequirementProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

export function setRequirementCompleted(id, completed) {
    // Update the existing manual progress system
    const progress = getRequirementProgress();
    progress[id] = completed;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );

    // Synchronize with the Dashboard's checklist
    const checklist = loadChecklist();

    if (checklist) {
        const evidence = { ...checklist.evidence };
        const previous = evidence[id] || {};

        evidence[id] = {
            ...previous,
            status: completed
                ? "evidence_reviewed"
                : previous.documents?.length
                    ? "document_received"
                    : "not_submitted",
            documents: previous.documents || []
        };

        saveEvidence(evidence);
    }

    // Notify all BizBridge pages
    window.dispatchEvent(
        new CustomEvent("bizbridge:progress-updated")
    );

    window.dispatchEvent(
        new CustomEvent("bizbridge:checklist-updated")
    );
}