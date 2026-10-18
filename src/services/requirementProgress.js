const STORAGE_KEY = "bizbridge-requirement-progress";

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
        new CustomEvent("bizbridge:progress-updated")
    );
}