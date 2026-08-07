/**
 * =====================================================
 * TEST FILE: chatController.js - Integration Tests
 * =====================================================
 * Ye file handleChat() aur trackSessionEngagement()
 * controllers ko test karti hai.
 *
 * IMPORTANT - ESM Mocking:
 * ESM modules ke saath jest.mock() hoist nahi hota.
 * Isliye hum jest.unstable_mockModule() use karte hain
 * aur phir dynamic import() se controller load karte hain.
 * =====================================================
 */

// ─── Step 1: Jest globals import (ESM mein zaroori hai) ──
import { jest, describe, it, expect } from '@jest/globals';

// ─── Step 2: Mocks setup (dynamic import se PEHLE) ──────
// ESM mein jest.unstable_mockModule() use hota hai

jest.unstable_mockModule('../services/vectorSearch.js', () => ({
  searchContext: jest.fn().mockResolvedValue(
    'Dhruv Patel is a Full-Stack Developer with skills in React, Node.js, MongoDB.'
  )
}));

jest.unstable_mockModule('../services/groqService.js', () => ({
  generateChatCompletion: jest.fn().mockResolvedValue(
    'Dhruv Patel is a talented Full-Stack Developer and AI Engineer.'
  ),
  generateFollowUpSuggestions: jest.fn().mockResolvedValue([
    'What projects did he build?',
    'Tell me about his React skills',
    'How can I contact him?'
  ])
}));

jest.unstable_mockModule('../models/ChatSession.js', () => ({
  default: {
    findOneAndUpdate: jest.fn().mockResolvedValue({ sessionId: 'test-session' })
  }
}));

jest.unstable_mockModule('../models/ChatMessage.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: 'mock-id' })
  }))
}));

jest.unstable_mockModule('../services/geoService.js', () => ({
  getIpLocation: jest.fn().mockResolvedValue('Ahmedabad, India')
}));

// ─── Step 3: Dynamic import (mocks setup ke BAAD) ───────
// Top-level await ESM mein allowed hai
const { handleChat, trackSessionEngagement } = await import('../controllers/chatController.js');

// ─── HELPER FUNCTION ─────────────────────────────────────
/**
 * Fake req aur res object banata hai testing ke liye
 * @param {Object} body - Request body
 * @returns {{ req, res }}
 */
function makeMockReqRes(body = {}) {
  const req = {
    body,
    headers: { 'x-forwarded-for': '' },
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1'
  };

  const res = {
    status: jest.fn().mockReturnThis(), // chaining ke liye: res.status(400).json(...)
    json: jest.fn()
  };

  return { req, res };
}

// ─── TESTS: handleChat() ──────────────────────────────────

describe('handleChat() Controller', () => {

  // ── Input Validation ──────────────────────────────────
  describe('Input Validation', () => {

    it('should return 400 if message is missing (empty string)', async () => {
      const { req, res } = makeMockReqRes({ message: '' });

      await handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Message must be a non-empty string.'
      });
    });

    it('should return 400 if message is null', async () => {
      const { req, res } = makeMockReqRes({ message: null });

      await handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if message is a number (not a string)', async () => {
      const { req, res } = makeMockReqRes({ message: 42 });

      await handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if message exceeds 500 characters', async () => {
      const { req, res } = makeMockReqRes({ message: 'x'.repeat(501) });

      await handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Message exceeds the maximum length of 500 characters.'
      });
    });

    it('should accept a valid message of exactly 500 characters', async () => {
      const { req, res } = makeMockReqRes({
        message: 'a'.repeat(500),
        sessionId: 'test-session-abc'
      });

      await handleChat(req, res);

      // 400 nahi aana chahiye
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  // ── Successful Response ───────────────────────────────
  describe('Successful Chat Response', () => {

    it('should return reply, suggestions, and sessionId on valid request', async () => {
      const { req, res } = makeMockReqRes({
        message: 'What are Dhruv skills?',
        history: [],
        sessionId: 'session-test-001'
      });

      await handleChat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reply: expect.any(String),
          suggestions: expect.any(Array),
          sessionId: 'session-test-001'
        })
      );
    });

    it('should auto-generate a sessionId if client does not provide one', async () => {
      const { req, res } = makeMockReqRes({
        message: 'Tell me about his projects'
        // sessionId deliberately omitted
      });

      await handleChat(req, res);

      // sessionId auto-generate hona chahiye
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.stringContaining('session_')
        })
      );
    });

    it('should return suggestions as an array of 3 items', async () => {
      const { req, res } = makeMockReqRes({
        message: 'What is his tech stack?',
        history: [],
        sessionId: 'test-123'
      });

      await handleChat(req, res);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.suggestions).toHaveLength(3);
    });

    it('should handle history array correctly', async () => {
      const { req, res } = makeMockReqRes({
        message: 'Tell me more',
        history: [
          { role: 'user', content: 'What are his skills?' },
          { role: 'bot', content: 'He knows React and Node.js' }
        ],
        sessionId: 'test-history-session'
      });

      await handleChat(req, res);

      // 500 error nahi aana chahiye
      expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('should treat non-array history as empty array gracefully', async () => {
      const { req, res } = makeMockReqRes({
        message: 'What are his projects?',
        history: 'invalid-history-string', // string hai, array nahi
        sessionId: 'test-session-x'
      });

      await handleChat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ reply: expect.any(String) })
      );
    });
  });

});

// ─── TESTS: trackSessionEngagement() ─────────────────────

describe('trackSessionEngagement() Controller', () => {

  // ── Input Validation ──────────────────────────────────
  describe('Input Validation', () => {

    it('should return 400 if sessionId is missing', async () => {
      const { req, res } = makeMockReqRes({ action: 'resume' });

      await trackSessionEngagement(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Session ID and action are required.'
      });
    });

    it('should return 400 if action is missing', async () => {
      const { req, res } = makeMockReqRes({ sessionId: 'session_abc' });

      await trackSessionEngagement(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for an invalid action type', async () => {
      const { req, res } = makeMockReqRes({
        sessionId: 'session_abc',
        action: 'invalidAction'
      });

      await trackSessionEngagement(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Invalid action type')
      });
    });
  });

  // ── Valid Actions ─────────────────────────────────────
  describe('Valid Action Types', () => {

    // Ye array mein sare valid actions hain
    const validActions = ['resume', 'project', 'github', 'linkedin'];

    // Har valid action ke liye automatically ek test create hoga
    validActions.forEach((action) => {
      it(`should return { success: true } for valid action: "${action}"`, async () => {
        const { req, res } = makeMockReqRes({
          sessionId: 'session_test_001',
          action
        });

        await trackSessionEngagement(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true });
      });
    });
  });

});
