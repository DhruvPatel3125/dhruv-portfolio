import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import History from '../models/History.js';
import About from '../models/About.js';
import { clearKnowledgeCache } from '../services/knowledgeLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

// Helper to get local JSON fallback file paths with Vercel serverless resolution support
function getFilePath(type) {
  const fileNameMap = {
    projects: 'project.json',
    skills: 'skills.json',
    history: 'history.json',
    about: 'additional.json'
  };
  const fileName = fileNameMap[type];
  if (!fileName) return null;

  const pathsToTry = [
    path.resolve(__dirname, '../data', fileName),
    path.resolve(process.cwd(), 'server/data', fileName),
    path.resolve(process.cwd(), 'data', fileName)
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Safely read local JSON file for fallback
function readJsonFallback(type) {
  const filePath = getFilePath(type);
  if (filePath && fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (err) {
      console.error(`[PortfolioController] Error reading fallback file for '${type}':`, err.message);
    }
  }
  return type === 'about' ? { about: {} } : [];
}

// Safely write to local JSON file for backup sync
function syncJsonFile(type, data) {
  try {
    const filePath = getFilePath(type);
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn(`[PortfolioController] Could not sync JSON file for '${type}':`, err.message);
  }
}

/**
 * Auto-seed database from JSON files if database collections are empty
 */
export async function seedDatabaseFromJSON() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    // 1. Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const jsonProjects = readJsonFallback('projects');
      if (Array.isArray(jsonProjects) && jsonProjects.length > 0) {
        await Project.insertMany(jsonProjects.map((p, idx) => ({ ...p, order: idx })));
        console.log(`[PortfolioController] Seeded ${jsonProjects.length} projects into MongoDB.`);
      }
    }

    // 2. Skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      const jsonSkills = readJsonFallback('skills');
      if (Array.isArray(jsonSkills) && jsonSkills.length > 0) {
        await Skill.insertMany(jsonSkills.map((s, idx) => ({ ...s, order: idx })));
        console.log(`[PortfolioController] Seeded ${jsonSkills.length} skills into MongoDB.`);
      }
    }

    // 3. History
    const historyCount = await History.countDocuments();
    if (historyCount === 0) {
      const jsonHistory = readJsonFallback('history');
      if (Array.isArray(jsonHistory) && jsonHistory.length > 0) {
        await History.insertMany(jsonHistory.map((h, idx) => ({ ...h, order: idx })));
        console.log(`[PortfolioController] Seeded ${jsonHistory.length} history items into MongoDB.`);
      }
    }

    // 4. About
    const aboutCount = await About.countDocuments();
    if (aboutCount === 0) {
      const jsonAbout = readJsonFallback('about');
      if (jsonAbout && jsonAbout.about) {
        await About.create(jsonAbout);
        console.log(`[PortfolioController] Seeded about profile into MongoDB.`);
      }
    }
  } catch (error) {
    console.error('[PortfolioController] Error seeding database:', error.message);
  }
}

/**
 * GET /api/portfolio/:type
 * Retrieve raw portfolio data of a specific type dynamically from MongoDB.
 */
export async function getPortfolioData(req, res) {
  try {
    const { type } = req.params;

    if (!['projects', 'skills', 'history', 'about'].includes(type)) {
      return res.status(400).json({ error: `Invalid portfolio section type: '${type}'` });
    }

    // Try MongoDB first if connected
    if (mongoose.connection.readyState === 1) {
      await seedDatabaseFromJSON();

      if (type === 'projects') {
        const projects = await Project.find({}).sort({ order: 1, createdAt: 1 }).lean();
        if (projects && projects.length > 0) {
          return res.json(projects);
        }
      } else if (type === 'skills') {
        const skills = await Skill.find({}).sort({ order: 1, createdAt: 1 }).lean();
        if (skills && skills.length > 0) {
          return res.json(skills);
        }
      } else if (type === 'history') {
        const history = await History.find({}).sort({ order: 1, createdAt: 1 }).lean();
        if (history && history.length > 0) {
          return res.json(history);
        }
      } else if (type === 'about') {
        const aboutDoc = await About.findOne({}).lean();
        if (aboutDoc) {
          return res.json({
            about: aboutDoc.about || {},
            certifications: aboutDoc.certifications || [],
            accomplishments: aboutDoc.accomplishments || []
          });
        }
      }
    }

    // Fallback to local JSON files if DB is empty or disconnected
    console.warn(`[PortfolioController] Serving '${type}' from JSON fallback.`);
    const fallbackData = readJsonFallback(type);
    return res.json(fallbackData);
  } catch (error) {
    console.error(`[PortfolioController] Error loading data for type '${req.params.type}':`, error);
    // Graceful fallback to JSON file
    const fallbackData = readJsonFallback(req.params.type);
    return res.json(fallbackData);
  }
}

/**
 * POST /api/portfolio/:type
 * Update portfolio data of a specific type directly in MongoDB.
 * Requires admin authentication.
 */
export async function updatePortfolioData(req, res) {
  try {
    const { type } = req.params;
    const newData = req.body;

    if (!['projects', 'skills', 'history', 'about'].includes(type)) {
      return res.status(400).json({ error: `Invalid portfolio section type: '${type}'` });
    }

    if (!newData) {
      return res.status(400).json({ error: 'Request body cannot be empty.' });
    }

    if (type === 'about') {
      if (typeof newData !== 'object' || Array.isArray(newData)) {
        return res.status(400).json({ error: 'About data must be a JSON object.' });
      }
    } else {
      if (!Array.isArray(newData)) {
        return res.status(400).json({ error: `Portfolio data for '${type}' must be a JSON array.` });
      }
    }

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      if (type === 'projects') {
        await Project.deleteMany({});
        if (newData.length > 0) {
          await Project.insertMany(newData.map((p, i) => ({
            title: p.title || 'Untitled Project',
            description: p.description || '',
            skills: Array.isArray(p.skills) ? p.skills : [],
            demo: p.demo || '',
            source: p.source || '',
            highlights: Array.isArray(p.highlights) ? p.highlights : [],
            imageSrc: p.imageSrc || '',
            order: i
          })));
        }
      } else if (type === 'skills') {
        await Skill.deleteMany({});
        if (newData.length > 0) {
          await Skill.insertMany(newData.map((s, i) => ({
            title: s.title || 'Skill',
            category: s.category || 'frontend',
            order: i
          })));
        }
      } else if (type === 'history') {
        await History.deleteMany({});
        if (newData.length > 0) {
          await History.insertMany(newData.map((h, i) => ({
            role: h.role || 'Role',
            organisation: h.organisation || '',
            startDate: h.startDate || '',
            endDate: h.endDate || '',
            experiences: Array.isArray(h.experiences) ? h.experiences : [],
            type: h.type || 'experience',
            imageSrc: h.imageSrc || '',
            order: i
          })));
        }
      } else if (type === 'about') {
        const aboutPayload = newData.about ? newData : { about: newData };
        await About.deleteMany({});
        await About.create(aboutPayload);
      }
    }

    // Keep JSON file in sync for backup / fallback
    syncJsonFile(type, newData);

    // Reset Chatbot's compiled knowledge cache so AI incorporates changes immediately
    clearKnowledgeCache();

    console.log(`[PortfolioController] Updated '${type}' in MongoDB and cleared chatbot cache.`);
    return res.json({ success: true, message: `Portfolio section '${type}' saved to database successfully.` });
  } catch (error) {
    console.error(`[PortfolioController] Error updating data for type '${req.params.type}':`, error);
    return res.status(500).json({ error: 'Failed to save portfolio data changes.' });
  }
}

/**
 * POST /api/portfolio/projects/item
 * Add a single project directly into MongoDB.
 */
export async function createProjectItem(req, res) {
  try {
    const { title, description, skills, demo, source, highlights, imageSrc } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const count = await Project.countDocuments();
    const newProject = await Project.create({
      title,
      description: description || '',
      skills: Array.isArray(skills) ? skills : [],
      demo: demo || '',
      source: source || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      imageSrc: imageSrc || '',
      order: count
    });

    clearKnowledgeCache();
    return res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error('[PortfolioController] Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create new project item.' });
  }
}

/**
 * DELETE /api/portfolio/projects/item/:id
 * Delete a single project by ID from MongoDB.
 */
export async function deleteProjectItem(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project item not found.' });
    }

    clearKnowledgeCache();
    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('[PortfolioController] Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project item.' });
  }
}
