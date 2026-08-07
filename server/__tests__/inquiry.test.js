/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         INQUIRY MODEL - STEP BY STEP TEST FILE          ║
 * ║                                                          ║
 * ║  Ye file ek live classroom hai testing sikhne ke liye.  ║
 * ║  Har test ke upar EXPLANATION likhi hai HINDI mein.      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ════════════════════════════════════════════════════════════
// STEP 1: IMPORTS - Kya kya chahiye test likhne ke liye?
// ════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

//
// STEP 1 EXPLANATION:
// ─────────────────────────────────────────────────────────────
// describe  → Tests ka GROUP banana (jaise ek folder)
// it        → EK test likhna (ek checkmark ✓)
// expect    → Kisi cheez ko CHECK karna
// beforeAll → Sare tests se PEHLE ek baar kuch karo
// afterAll  → Sare tests ke BAAD ek baar kuch karo
// beforeEach→ HAR test se pehle kuch karo
// mongoose  → Humara actual model import karne ke liye
//


// ════════════════════════════════════════════════════════════
// STEP 2: MONGODB MOCK - Real Database Se Bacho!
// ════════════════════════════════════════════════════════════

//
// STEP 2 EXPLANATION:
// ─────────────────────────────────────────────────────────────
// Test mein hum REAL MongoDB connect nahi karte.
// Kyun? Kyunki:
//   1. Real DB slow hoti hai (network call)
//   2. Real DB mein garbage data aa jaata hai
//   3. Real DB har machine pe nahi hoti (CI/CD)
//
// Solution: "mongodb-memory-server" use karo
// Ye ek FAKE database hai jo RAM mein chalti hai!
// Fast hai, safe hai, koi side effects nahi.
//
// Install karo: npm install --save-dev mongodb-memory-server
//

import { MongoMemoryServer } from 'mongodb-memory-server';

// Inquiry model import karo (ye hum test karenge)
const { default: Inquiry } = await import('../models/Inquiry.js');

// ════════════════════════════════════════════════════════════
// STEP 3: SETUP & TEARDOWN - Database Start/Stop Karo
// ════════════════════════════════════════════════════════════

//
// STEP 3 EXPLANATION:
// ─────────────────────────────────────────────────────────────
// beforeAll → Sare tests shuru hone se PEHLE ek baar chalta hai
//             Yahan hum fake MongoDB start karte hain
//
// afterAll  → Sare tests khatam hone ke BAAD ek baar chalta hai
//             Yahan hum fake MongoDB band karte hain
//
// beforeEach → HAR test se pehle chalta hai
//              Yahan hum database clean karte hain
//              Taaki ek test ka data doosre test ko affect na kare!
//

let mongoServer;

// Sare tests shuru hone se PEHLE: Fake DB start karo
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Console mein message: "Fake DB start ho gayi!"
});

// Sare tests khatam hone ke BAAD: Fake DB band karo
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // Console mein message: "Fake DB band ho gayi!"
});

// HAR test se PEHLE: Database saaf karo
beforeEach(async () => {
  await Inquiry.deleteMany({});
  // Taaki pehle test ka data doosra test na dekhe
});


// ════════════════════════════════════════════════════════════
// STEP 4: TEST LIKHNA - AAA Pattern
// ════════════════════════════════════════════════════════════

//
// STEP 4 EXPLANATION - AAA PATTERN:
// ─────────────────────────────────────────────────────────────
//
//  A = ARRANGE  → Data tayar karo ("setup karo")
//  A = ACT      → Function/code run karo ("karo")
//  A = ASSERT   → Result check karo ("dekho")
//
//  Ye pattern HAR test mein follow karo!
//  Isse tests readable aur maintainable rehte hain.
//


// ════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 1: Valid Inquiry Creation
// ════════════════════════════════════════════════════════════

describe('Inquiry Model - Successful Cases (Kab kaam karta hai?)', () => {

  // ─────────────────────────────────────────────────────────
  // TEST 1: Sabse Basic Test - Kya valid inquiry save ho sakti hai?
  // ─────────────────────────────────────────────────────────
  it('should save a valid inquiry to the database', async () => {

    // ── ARRANGE: Data tayar karo ─────────────────────────────
    // Ek valid inquiry object banao jisme sab required fields hain
    const validInquiry = new Inquiry({
      name: 'Dhruv Patel',
      email: 'dhruv@example.com',
      message: 'I want to hire you for my project!'
    });

    // ── ACT: Action lo ──────────────────────────────────────
    // Database mein save karo
    const savedInquiry = await validInquiry.save();

    // ── ASSERT: Check karo ──────────────────────────────────
    // 1. Kya save hua? MongoDB hamesha _id deta hai
    expect(savedInquiry._id).toBeDefined();     // _id hona chahiye

    // 2. Kya name sahi save hua?
    expect(savedInquiry.name).toBe('Dhruv Patel');

    // 3. Kya email sahi save hui?
    expect(savedInquiry.email).toBe('dhruv@example.com');

    // 4. Kya message sahi save hua?
    expect(savedInquiry.message).toBe('I want to hire you for my project!');
  });


  // ─────────────────────────────────────────────────────────
  // TEST 2: Default Values Check - Schema mein default rakhe hain
  // ─────────────────────────────────────────────────────────
  it('should use default values for optional fields when not provided', async () => {

    // ── ARRANGE: Sirf required fields do ────────────────────
    const inquiry = new Inquiry({
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello there!'
      // ipAddress, userAgent, location, sessionId - nahi diya
    });

    // ── ACT ─────────────────────────────────────────────────
    const saved = await inquiry.save();

    // ── ASSERT: Default values check karo ───────────────────
    // Schema mein likha tha: default: 'Unknown'
    expect(saved.ipAddress).toBe('Unknown');    // Default: 'Unknown'
    expect(saved.userAgent).toBe('Unknown');    // Default: 'Unknown'
    expect(saved.location).toBe('Unknown');     // Default: 'Unknown'
    expect(saved.sessionId).toBeNull();         // Default: null

    // createdAt automatically set honi chahiye
    expect(saved.createdAt).toBeDefined();
    expect(saved.createdAt).toBeInstanceOf(Date);
  });


  // ─────────────────────────────────────────────────────────
  // TEST 3: trim: true check - Spaces automatically hatne chahiye
  // ─────────────────────────────────────────────────────────
  it('should trim whitespace from name and email (trim: true)', async () => {

    // ── ARRANGE: Spaces ke saath input do ───────────────────
    const inquiry = new Inquiry({
      name: '   Dhruv Patel   ',   // Spaces ke saath!
      email: '  dhruv@test.com  ', // Spaces ke saath!
      message: 'Test message'
    });

    // ── ACT ─────────────────────────────────────────────────
    const saved = await inquiry.save();

    // ── ASSERT: Spaces hat gayi honi chahiye ─────────────────
    // trim: true ka kaam yahi hai - spaces automatically hatao
    expect(saved.name).toBe('Dhruv Patel');       // Spaces hat gayi!
    expect(saved.email).toBe('dhruv@test.com');   // Spaces hat gayi!
  });


  // ─────────────────────────────────────────────────────────
  // TEST 4: Custom Values - Jab optional fields provide karein
  // ─────────────────────────────────────────────────────────
  it('should save all optional fields when explicitly provided', async () => {

    // ── ARRANGE ─────────────────────────────────────────────
    const inquiry = new Inquiry({
      name: 'Recruiter Name',
      email: 'recruiter@company.com',
      message: 'We have an opportunity for you!',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      location: 'Mumbai, India',
      sessionId: 'session_abc123'
    });

    // ── ACT ─────────────────────────────────────────────────
    const saved = await inquiry.save();

    // ── ASSERT ──────────────────────────────────────────────
    expect(saved.ipAddress).toBe('192.168.1.100');
    expect(saved.userAgent).toBe('Mozilla/5.0');
    expect(saved.location).toBe('Mumbai, India');
    expect(saved.sessionId).toBe('session_abc123');
  });

});


// ════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 2: Validation - Galat Input Pe Error Aana Chahiye
// ════════════════════════════════════════════════════════════

//
// VALIDATION TESTS EXPLANATION:
// ─────────────────────────────────────────────────────────────
// Schema mein "required: true" likha hai.
// Iska matlab: agar ye field nahi di, toh error AANI CHAHIYE.
// Test karte hain ki ye error actually aati hai ya nahi.
//
// expect(...).rejects.toThrow() → async error expect karna
//

describe('Inquiry Model - Validation (Galat Input Ka Kya Hoga?)', () => {

  // ─────────────────────────────────────────────────────────
  // TEST 5: name required hai - Bina name ke kya hoga?
  // ─────────────────────────────────────────────────────────
  it('should throw error if name is missing (required: true)', async () => {

    // ── ARRANGE: Name field missing rakho ───────────────────
    const inquiryWithoutName = new Inquiry({
      // name: nahi diya intentionally!
      email: 'test@example.com',
      message: 'Test message'
    });

    // ── ACT + ASSERT: Error aani chahiye ────────────────────
    // .rejects.toThrow() → expect karte hain ki promise reject hoga
    await expect(inquiryWithoutName.save()).rejects.toThrow();

    //
    // EXPLANATION:
    // ─────────────────────────────────────────────────────────
    // save() ek async function hai.
    // Jab error aaye async function mein, toh:
    //   await expect(promise).rejects.toThrow()
    // use karo!
    //
  });


  // ─────────────────────────────────────────────────────────
  // TEST 6: email required hai
  // ─────────────────────────────────────────────────────────
  it('should throw error if email is missing (required: true)', async () => {

    const inquiryWithoutEmail = new Inquiry({
      name: 'Dhruv',
      // email: nahi diya!
      message: 'Hello!'
    });

    await expect(inquiryWithoutEmail.save()).rejects.toThrow();
  });


  // ─────────────────────────────────────────────────────────
  // TEST 7: message required hai
  // ─────────────────────────────────────────────────────────
  it('should throw error if message is missing (required: true)', async () => {

    const inquiryWithoutMessage = new Inquiry({
      name: 'Dhruv',
      email: 'dhruv@example.com'
      // message: nahi diya!
    });

    await expect(inquiryWithoutMessage.save()).rejects.toThrow();
  });


  // ─────────────────────────────────────────────────────────
  // TEST 8: Teeno required fields missing - Sab missing
  // ─────────────────────────────────────────────────────────
  it('should throw error when all required fields are missing', async () => {

    // Kuch bhi nahi diya!
    const emptyInquiry = new Inquiry({});

    await expect(emptyInquiry.save()).rejects.toThrow();
  });

});


// ════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 3: Database Operations - CRUD Tests
// ════════════════════════════════════════════════════════════

//
// CRUD TESTS EXPLANATION:
// ─────────────────────────────────────────────────────────────
// C = Create (banao)
// R = Read   (pado)
// U = Update (update karo)
// D = Delete (hatao)
//
// Real application mein ye sab operations hote hain.
// Test karte hain ki sab sahi kaam kar raha hai.
//

describe('Inquiry Model - Database Operations (CRUD)', () => {

  // ─────────────────────────────────────────────────────────
  // TEST 9: Ek inquiry dhoondo by ID
  // ─────────────────────────────────────────────────────────
  it('should find an inquiry by its ID', async () => {

    // ── ARRANGE: Pehle save karo ─────────────────────────────
    const inquiry = await Inquiry.create({
      name: 'Find Me',
      email: 'findme@test.com',
      message: 'Please find me!'
    });

    // ── ACT: ID se dhoondo ───────────────────────────────────
    const found = await Inquiry.findById(inquiry._id);

    // ── ASSERT: Mili? ───────────────────────────────────────
    expect(found).not.toBeNull();            // null nahi honi chahiye
    expect(found.name).toBe('Find Me');      // Name match hona chahiye
    expect(found.email).toBe('findme@test.com');
  });


  // ─────────────────────────────────────────────────────────
  // TEST 10: Sari inquiries count karo
  // ─────────────────────────────────────────────────────────
  it('should count all inquiries in database', async () => {

    // ── ARRANGE: 3 inquiries banao ──────────────────────────
    await Inquiry.create({ name: 'User 1', email: 'u1@test.com', message: 'Msg 1' });
    await Inquiry.create({ name: 'User 2', email: 'u2@test.com', message: 'Msg 2' });
    await Inquiry.create({ name: 'User 3', email: 'u3@test.com', message: 'Msg 3' });

    // ── ACT: Count karo ─────────────────────────────────────
    const count = await Inquiry.countDocuments();

    // ── ASSERT: 3 hone chahiye ─────────────────────────────
    expect(count).toBe(3);
  });


  // ─────────────────────────────────────────────────────────
  // TEST 11: Inquiry delete karo
  // ─────────────────────────────────────────────────────────
  it('should delete an inquiry from database', async () => {

    // ── ARRANGE: Pehle banao ────────────────────────────────
    const inquiry = await Inquiry.create({
      name: 'Delete Me',
      email: 'delete@test.com',
      message: 'Please delete!'
    });

    // ── ACT: Delete karo ─────────────────────────────────────
    await Inquiry.findByIdAndDelete(inquiry._id);

    // ── ASSERT: Ab nahi milni chahiye ──────────────────────
    const found = await Inquiry.findById(inquiry._id);
    expect(found).toBeNull();   // null honi chahiye - delete ho gayi!
  });

});
