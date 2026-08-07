import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import History from '../models/History.js';
import About from '../models/About.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

// Cache formatted context string in memory to minimize database and disk reads
let cachedKnowledgeString = null;

function loadJsonFile(fileName) {
  try {
    const pathsToTry = [
      path.resolve(__dirname, '../data', fileName),
      path.resolve(process.cwd(), 'server/data', fileName),
      path.resolve(process.cwd(), 'data', fileName)
    ];

    let targetPath = null;
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return null;
    }
    const rawData = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`[KnowledgeLoader] Error reading fallback file ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Formats portfolio data into structured Markdown sections.
 * Pulls from MongoDB if connected, otherwise falls back to static JSON files.
 * @returns {Promise<string>|string} Compiled Markdown knowledge base
 */
export async function getFormattedKnowledge() {
  if (cachedKnowledgeString) {
    return cachedKnowledgeString;
  }

  console.log('[KnowledgeLoader] Compilation of knowledge base started...');
  let compiled = '';

  let aboutData = null;
  let historyData = null;
  let skillsData = null;
  let projectsData = null;

  // Attempt to fetch live database models if MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    try {
      const aboutDoc = await About.findOne({}).lean();
      if (aboutDoc) aboutData = aboutDoc;

      const historyDocs = await History.find({}).sort({ order: 1, createdAt: 1 }).lean();
      if (historyDocs && historyDocs.length > 0) historyData = historyDocs;

      const skillDocs = await Skill.find({}).sort({ order: 1, createdAt: 1 }).lean();
      if (skillDocs && skillDocs.length > 0) skillsData = skillDocs;

      const projectDocs = await Project.find({}).sort({ order: 1, createdAt: 1 }).lean();
      if (projectDocs && projectDocs.length > 0) projectsData = projectDocs;
    } catch (err) {
      console.warn('[KnowledgeLoader] Could not fetch DB knowledge, using JSON fallback:', err.message);
    }
  }

  // Fallbacks if database is empty or disconnected
  if (!aboutData) aboutData = loadJsonFile('additional.json');
  if (!historyData) historyData = loadJsonFile('history.json');
  if (!skillsData) skillsData = loadJsonFile('skills.json');
  if (!projectsData) projectsData = loadJsonFile('project.json');

  // 1. Load Profile / About Info
  if (aboutData && aboutData.about) {
    const { name, title, summary, email, github, linkedin, portfolio, resumeUrl } = aboutData.about;
    compiled += `## GENERAL CANDIDATE INFO\n`;
    compiled += `- **Name**: ${name}\n`;
    compiled += `- **Title**: ${title}\n`;
    compiled += `- **Summary**: ${summary}\n`;
    compiled += `- **Email**: ${email}\n`;
    compiled += `- **GitHub**: ${github}\n`;
    compiled += `- **LinkedIn**: ${linkedin}\n`;
    compiled += `- **Portfolio Website**: ${portfolio}\n`;
    compiled += `- **Resume Download URL**: ${resumeUrl}\n\n`;
  }

  // 2. Load Work Experience & Education
  if (historyData && Array.isArray(historyData)) {
    const experiences = historyData.filter(item => item.type === 'experience');
    const education = historyData.filter(item => item.type === 'education');

    if (experiences.length > 0) {
      compiled += `## PROFESSIONAL EXPERIENCE & INTERNSHIPS\n\n`;
      experiences.forEach(exp => {
        compiled += `### Role: ${exp.role}\n`;
        compiled += `- **Organization**: ${exp.organisation}\n`;
        compiled += `- **Duration**: ${exp.startDate} to ${exp.endDate}\n`;
        compiled += `- **Key Responsibilities & Highlights**:\n`;
        if (exp.experiences && Array.isArray(exp.experiences)) {
          exp.experiences.forEach(desc => {
            compiled += `  * ${desc}\n`;
          });
        }
        compiled += `\n`;
      });
    }

    if (education.length > 0) {
      compiled += `## ACADEMIC / EDUCATION HISTORY\n\n`;
      education.forEach(edu => {
        compiled += `### Degree: ${edu.role}\n`;
        compiled += `- **Institution**: ${edu.organisation}\n`;
        compiled += `- **Duration**: ${edu.startDate} to ${edu.endDate}\n`;
        compiled += `- **Academic Accomplishments**:\n`;
        if (edu.experiences && Array.isArray(edu.experiences)) {
          edu.experiences.forEach(desc => {
            compiled += `  * ${desc}\n`;
          });
        }
        compiled += `\n`;
      });
    }
  }

  // 3. Load Technical Skills
  if (skillsData && Array.isArray(skillsData)) {
    compiled += `## TECHNICAL SKILLS & COMPETENCIES\n\n`;
    const categories = {
      languages: 'Programming Languages',
      frontend: 'Frontend Technologies',
      backend: 'Backend & Databases',
      tools: 'Developer Tools & Cloud Services'
    };

    Object.entries(categories).forEach(([key, categoryTitle]) => {
      const filtered = skillsData.filter(s => s.category === key);
      if (filtered.length > 0) {
        compiled += `### ${categoryTitle}\n`;
        compiled += filtered.map(s => s.title).join(', ') + '\n\n';
      }
    });
  }

  // 4. Load Portfolio Projects
  if (projectsData && Array.isArray(projectsData)) {
    compiled += `## PORTFOLIO PROJECTS\n\n`;
    projectsData.forEach((proj, idx) => {
      compiled += `### Project ${idx + 1}: ${proj.title}\n`;
      compiled += `- **Description**: ${proj.description}\n`;
      compiled += `- **Tech Stack**: ${Array.isArray(proj.skills) ? proj.skills.join(', ') : ''}\n`;
      compiled += `- **Live Link**: ${proj.demo}\n`;
      compiled += `- **Source Code**: ${proj.source}\n`;
      if (proj.highlights && Array.isArray(proj.highlights)) {
        compiled += `- **Key Highlights**:\n`;
        proj.highlights.forEach(h => {
          compiled += `  * ${h}\n`;
        });
      }
      compiled += `\n`;
    });
  }

  // 5. Load Certifications
  if (aboutData && aboutData.certifications && Array.isArray(aboutData.certifications)) {
    compiled += `## CERTIFICATIONS\n\n`;
    aboutData.certifications.forEach(cert => {
      compiled += `- **Title**: ${cert.title}\n`;
      compiled += `  * **Issuer**: ${cert.issuer}\n`;
      compiled += `  * **Year**: ${cert.year}\n`;
      compiled += `  * **Details**: ${cert.details}\n\n`;
    });
  }

  cachedKnowledgeString = compiled.trim();
  console.log('[KnowledgeLoader] Knowledge base compiled successfully.');
  
  return cachedKnowledgeString;
}

/**
 * Clears the knowledge cache. Useful if portfolio data changes dynamically.
 */
export function clearKnowledgeCache() {
  cachedKnowledgeString = null;
}
