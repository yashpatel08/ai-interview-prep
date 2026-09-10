export function extractJson(text: string): unknown {
    const trimmed = text.trim();

    try {
        return JSON.parse(trimmed);
    } catch {
        // Continue below and try to extract a JSON object/array.
    }

    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");

    if (objectStart >= 0 && objectEnd > objectStart) {
        return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
    }

    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");

    if (arrayStart >= 0 && arrayEnd > arrayStart) {
        return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    }

    throw new Error("LLM response did not contain valid JSON");
}