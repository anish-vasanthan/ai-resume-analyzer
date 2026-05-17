const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Extract text from PDF file
 */
async function extractPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 */
async function extractDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract DOCX: ${error.message}`);
  }
}

/**
 * Parse resume text to extract structured information
 */
function parseResumeText(text) {
  const parsed = {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    education: extractEducation(text),
    skills: extractSkills(text),
    certifications: extractCertifications(text),
    projects: extractProjects(text),
    experience: extractExperience(text)
  };

  return parsed;
}

/**
 * Extract name (usually first line or near contact info)
 */
function extractName(text) {
  const lines = text.split('\n').filter(line => line.trim());
  // Simple heuristic: first non-empty line that's not too long
  for (let line of lines.slice(0, 5)) {
    if (line.length < 50 && line.length > 3 && !line.includes('@')) {
      return line.trim();
    }
  }
  return '';
}

/**
 * Extract email address
 */
function extractEmail(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : '';
}

/**
 * Extract phone number
 */
function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0] : '';
}

/**
 * Extract education information
 */
function extractEducation(text) {
  const education = [];
  const educationKeywords = ['education', 'academic', 'qualification'];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'b.e', 'm.e', 'bsc', 'msc', 'diploma'];
  
  const lines = text.toLowerCase().split('\n');
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering education section
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      inEducationSection = true;
      continue;
    }
    
    // Check if we're leaving education section
    if (inEducationSection && (line.includes('experience') || line.includes('project') || line.includes('skill'))) {
      break;
    }
    
    // Extract degree information
    if (inEducationSection || degreeKeywords.some(keyword => line.includes(keyword))) {
      if (line.length > 10 && line.length < 200) {
        education.push({
          degree: line,
          institution: '',
          year: extractYear(line),
          gpa: extractGPA(line)
        });
      }
    }
  }
  
  return education;
}

/**
 * Extract skills
 */
function extractSkills(text) {
  const skills = [];
  const skillKeywords = ['skill', 'technical skill', 'technologies', 'tools'];
  const commonSkills = [
    'python', 'java', 'javascript', 'react', 'node', 'angular', 'vue',
    'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker',
    'kubernetes', 'git', 'html', 'css', 'typescript', 'c++', 'c#',
    'machine learning', 'deep learning', 'data analysis', 'power bi',
    'tableau', 'excel', 'pandas', 'numpy', 'tensorflow', 'pytorch'
  ];
  
  const lines = text.toLowerCase().split('\n');
  let inSkillSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (skillKeywords.some(keyword => line.includes(keyword))) {
      inSkillSection = true;
      continue;
    }
    
    if (inSkillSection && (line.includes('experience') || line.includes('project') || line.includes('education'))) {
      break;
    }
    
    if (inSkillSection || line.length < 100) {
      commonSkills.forEach(skill => {
        if (line.includes(skill) && !skills.includes(skill)) {
          skills.push(skill);
        }
      });
    }
  }
  
  return [...new Set(skills)];
}

/**
 * Extract certifications
 */
function extractCertifications(text) {
  const certifications = [];
  const certKeywords = ['certification', 'certificate', 'certified'];
  
  const lines = text.toLowerCase().split('\n');
  let inCertSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (certKeywords.some(keyword => line.includes(keyword))) {
      inCertSection = true;
      continue;
    }
    
    if (inCertSection && (line.includes('experience') || line.includes('project') || line.includes('education'))) {
      break;
    }
    
    if (inCertSection && line.length > 5 && line.length < 150) {
      certifications.push(line);
    }
  }
  
  return certifications;
}

/**
 * Extract projects — captures name (title), description, and technologies
 */
function extractProjects(text) {
  const projects = [];
  const projectKeywords = ['project', 'projects'];

  // Common tech keywords to detect in project lines
  const techKeywords = [
    'react', 'node', 'node.js', 'express', 'angular', 'vue', 'next.js', 'nuxt',
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go',
    'html', 'css', 'tailwind', 'bootstrap', 'sass',
    'mongodb', 'mysql', 'postgresql', 'sqlite', 'firebase', 'supabase', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'flask', 'django',
    'spring', 'spring boot', 'hibernate', 'rest api', 'graphql', 'socket.io',
    'jwt', 'oauth', 'stripe', 'twilio', 'openai', 'groq', 'langchain',
    'android', 'ios', 'flutter', 'react native', 'kotlin', 'swift'
  ];

  const lines = text.split('\n');
  const lowerLines = lines.map(l => l.toLowerCase().trim());
  let inProjectSection = false;
  let currentProject = null;

  for (let i = 0; i < lowerLines.length; i++) {
    const line = lowerLines[i];
    const originalLine = lines[i].trim();

    // Detect project section header (standalone word "projects" or "project")
    if (/^projects?\s*$/i.test(originalLine)) {
      inProjectSection = true;
      continue;
    }

    // Stop when hitting another major section header
    if (inProjectSection && /^(experience|work experience|employment|internship|education|skills|technical skills|certifications?|achievements?|awards?|summary|objective)\s*$/i.test(originalLine)) {
      if (currentProject) projects.push(currentProject);
      currentProject = null;
      break;
    }

    if (!inProjectSection) continue;
    if (originalLine.length < 3) continue;

    // Detect technologies mentioned in this line
    const foundTech = techKeywords.filter(t => line.includes(t));

    // Heuristic: a project TITLE is typically:
    //   - Short (< 80 chars)
    //   - Does NOT start with a bullet/dash
    //   - Does NOT look like a sentence (no verb indicators like "built", "developed", "a ", "an ")
    //   - Does NOT contain common description words
    const isBullet = /^[•\-\*\|>]/.test(originalLine);
    const looksLikeSentence = /\b(built|developed|created|designed|implemented|a |an |the |using |with |for |that |which )/i.test(originalLine);
    const isShort = originalLine.length < 80;
    const isTitle = !isBullet && isShort && !looksLikeSentence && originalLine.length > 3;

    if (isTitle && !line.includes('@') && !line.match(/^\d{4}/)) {
      // Save previous project before starting a new one
      if (currentProject) projects.push(currentProject);
      currentProject = {
        title: originalLine,
        name: originalLine,
        description: '',
        technologies: [...foundTech]
      };
    } else if (currentProject) {
      // Append to description of current project
      currentProject.description = (currentProject.description + ' ' + originalLine).trim();
      // Merge any new tech found
      foundTech.forEach(t => {
        if (!currentProject.technologies.includes(t)) currentProject.technologies.push(t);
      });
    }
  }

  if (currentProject) projects.push(currentProject);

  // Deduplicate and clean up
  return projects.slice(0, 6).map(p => ({
    ...p,
    description: p.description.slice(0, 300),
    technologies: [...new Set(p.technologies)]
  }));
}

/**
 * Extract work experience — groups lines into proper job entries
 * (title → company/duration → bullet descriptions)
 */
function extractExperience(text) {
  const experience  = [];
  const expHeaders  = /^(experience|work experience|employment|internship|professional experience)\s*$/i;
  const stopHeaders = /^(projects?|education|skills?|technical skills?|certifications?|achievements?|awards?|summary|objective)\s*$/i;
  const bulletRx    = /^[•\-\*\|>]\s*/;

  const lines       = text.split('\n').map(l => l.trim()).filter(Boolean);
  let inSection     = false;
  let current       = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section start
    if (expHeaders.test(line)) { inSection = true; continue; }

    // Detect section end
    if (inSection && stopHeaders.test(line)) {
      if (current) { experience.push(current); current = null; }
      break;
    }

    if (!inSection) continue;

    const isBullet   = bulletRx.test(line);
    const hasYear    = /\b(19|20)\d{2}\b/.test(line);
    const isShort    = line.length < 80;
    const isDuration = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b/i.test(line);

    if (!isBullet && isShort && !isDuration) {
      // New job title — save previous
      if (current) experience.push(current);
      current = { title: line, company: '', duration: '', description: '' };
    } else if (current) {
      if ((isDuration || hasYear) && isShort && !isBullet && !current.duration) {
        // Company / date line
        current.duration = extractDuration(line) || line;
        if (!current.company) {
          // Try to split "Company Name | Jan 2023 – Dec 2023"
          const parts = line.split(/[\|,–\-]/);
          if (parts.length > 1) {
            current.company  = parts[0].trim();
            current.duration = extractDuration(line) || parts.slice(1).join(' ').trim();
          }
        }
      } else {
        // Bullet or description line
        const clean = line.replace(bulletRx, '').trim();
        current.description = current.description
          ? current.description + ' | ' + clean
          : clean;
      }
    }
  }

  if (current) experience.push(current);
  return experience.slice(0, 6);
}

/**
 * Helper: Extract year from text
 */
function extractYear(text) {
  const yearRegex = /\b(19|20)\d{2}\b/g;
  const matches = text.match(yearRegex);
  return matches ? matches[matches.length - 1] : '';
}

/**
 * Helper: Extract GPA from text
 */
function extractGPA(text) {
  const gpaRegex = /\b\d\.\d{1,2}\b/g;
  const matches = text.match(gpaRegex);
  return matches ? matches[0] : '';
}

/**
 * Helper: Extract duration from text
 */
function extractDuration(text) {
  const durationRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*-\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/gi;
  const matches = text.match(durationRegex);
  return matches ? matches[0] : '';
}

module.exports = {
  extractPDF,
  extractDOCX,
  parseResumeText
};
