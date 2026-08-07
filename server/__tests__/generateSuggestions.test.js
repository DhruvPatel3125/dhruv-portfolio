/**
 * =====================================================
 * TEST FILE: generateSuggestions() - Unit Tests
 * =====================================================
 * Ye file chatController.js ke andar ke
 * generateSuggestions() function ko test karti hai.
 *
 * Hum function ko yahan manually copy karke test karte hain
 * kyunki wo currently private hai (export nahi hua).
 * =====================================================
 */

// ─── ESM Mode mein jest globals import karna zaroori hai ──
import { describe, it, expect } from '@jest/globals';

// ─── Copy of generateSuggestions from chatController.js ──
// Note: Agar tum chatController.js mein export karo toh:
// import { generateSuggestions } from '../controllers/chatController.js';
function generateSuggestions(reply) {
  const replyLower = reply.toLowerCase();
  const suggestions = [];

  if (replyLower.includes("don't have information about that") || replyLower.includes("no information")) {
    suggestions.push("What projects has Dhruv built?", "What are Dhruv's skills?", "How can I contact Dhruv?");
  } else if (replyLower.includes("project") || replyLower.includes("staylix") || replyLower.includes("syshop")) {
    suggestions.push("Tell me about his work experience", "What is his core tech stack?", "Can I download his CV?");
  } else if (replyLower.includes("skill") || replyLower.includes("frontend") || replyLower.includes("backend")) {
    suggestions.push("Tell me about Staylix project", "What did he study?", "How can I contact him?");
  } else if (replyLower.includes("experience") || replyLower.includes("planicsdev") || replyLower.includes("webito")) {
    suggestions.push("What side projects did he build?", "Where did he study?", "How to email him?");
  } else {
    suggestions.push("What are his skills?", "Tell me about his projects", "How to reach him?");
  }

  return [...new Set(suggestions)].slice(0, 3);
}

// ─── TESTS ────────────────────────────────────────────────

describe('generateSuggestions()', () => {

  // ── Default Case ──────────────────────────────────────
  describe('Default / Unknown Reply', () => {
    it('should return exactly 3 default suggestions for a generic reply', () => {
      const result = generateSuggestions('Dhruv is a developer');

      expect(result).toHaveLength(3);
      expect(result).toContain("What are his skills?");
      expect(result).toContain("Tell me about his projects");
      expect(result).toContain("How to reach him?");
    });

    it('should always return max 3 suggestions', () => {
      const result = generateSuggestions('random text xyz');
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  // ── "No Info" Case ────────────────────────────────────
  describe('When bot says it does not have information', () => {
    it('should return fallback suggestions when "don\'t have information about that" is in reply', () => {
      const result = generateSuggestions("I don't have information about that topic.");

      expect(result).toContain("What projects has Dhruv built?");
      expect(result).toContain("What are Dhruv's skills?");
      expect(result).toContain("How can I contact Dhruv?");
    });

    it('should handle "no information" phrase as well', () => {
      const result = generateSuggestions("Sorry, I have no information on that.");

      expect(result).toContain("What projects has Dhruv built?");
    });
  });

  // ── Project Case ─────────────────────────────────────
  describe('When reply mentions projects', () => {
    it('should return project-related suggestions when reply includes "project"', () => {
      const result = generateSuggestions('Dhruv has worked on many exciting projects.');

      expect(result).toContain("Tell me about his work experience");
      expect(result).toContain("What is his core tech stack?");
    });

    it('should return project suggestions when reply mentions "staylix"', () => {
      const result = generateSuggestions('Staylix is a hotel booking platform he built.');

      expect(result).toContain("Tell me about his work experience");
    });

    it('should return project suggestions when reply mentions "syshop"', () => {
      const result = generateSuggestions('Syshop is an e-commerce app he developed.');

      expect(result).toContain("Can I download his CV?");
    });
  });

  // ── Skills Case ───────────────────────────────────────
  describe('When reply mentions skills', () => {
    it('should return skill suggestions when reply includes "skill"', () => {
      const result = generateSuggestions('Dhruv has strong skills in React and Node.js.');

      expect(result).toContain("Tell me about Staylix project");
      expect(result).toContain("What did he study?");
    });

    it('should return skill suggestions for "frontend" keyword', () => {
      const result = generateSuggestions('He is a talented frontend developer.');

      expect(result).toContain("How can I contact him?");
    });

    it('should return skill suggestions for "backend" keyword', () => {
      const result = generateSuggestions('His backend expertise includes Express and MongoDB.');

      expect(result).toContain("Tell me about Staylix project");
    });
  });

  // ── Experience Case ───────────────────────────────────
  describe('When reply mentions experience or companies', () => {
    it('should return experience suggestions when reply includes "experience"', () => {
      const result = generateSuggestions('He has 1 year of work experience.');

      expect(result).toContain("What side projects did he build?");
      expect(result).toContain("Where did he study?");
    });

    it('should return experience suggestions when reply mentions "planicsdev"', () => {
      const result = generateSuggestions('He worked at PlanicsDev as a developer.');

      expect(result).toContain("How to email him?");
    });

    it('should return experience suggestions when reply mentions "webito"', () => {
      const result = generateSuggestions('He had an internship at Webito.');

      expect(result).toContain("What side projects did he build?");
    });
  });

  // ── Edge Cases ────────────────────────────────────────
  describe('Edge Cases', () => {
    it('should handle empty string without crashing', () => {
      const result = generateSuggestions('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should handle very long string', () => {
      const longText = 'a'.repeat(10000);
      const result = generateSuggestions(longText);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should be case-insensitive (uppercase "PROJECT" should match)', () => {
      const result = generateSuggestions('He has worked on great PROJECTS.');
      expect(result).toContain("Tell me about his work experience");
    });

    it('should return unique suggestions (no duplicates)', () => {
      const result = generateSuggestions('skills frontend skill');
      const uniqueResult = [...new Set(result)];
      expect(result.length).toBe(uniqueResult.length);
    });
  });

});
