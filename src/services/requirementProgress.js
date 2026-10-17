const STORAGE_KEY = "clearbridge-requirement-progress";

export function getRequirementProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

export function setRequirementCompleted(id, completed) {
    const progress = getRequirementProgress();

    progress[id] = completed;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    window.dispatchEvent(
        new CustomEvent("clearbridge:progress-updated")
    );
}