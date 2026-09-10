import { describe, expect, it } from "vitest";

describe("requirement extraction IDs", () => {
    it("creates stable sequential requirement IDs", () => {
        const requirements = [
            { text: "React", kind: "technical", priority: "must" },
            { text: "Node.js", kind: "technical", priority: "must" },
            { text: "AWS", kind: "technical", priority: "nice" },
        ];

        const result = requirements.map((requirement, index) => ({
            id: `r${index + 1}`,
            ...requirement,
        }));

        expect(result.map((item) => item.id)).toEqual([
            "r1",
            "r2",
            "r3",
        ]);
    });
});