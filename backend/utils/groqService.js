const Groq = require('groq-sdk');

/**
 * GroqService - Service layer for Groq API integration
 * Provides methods for resume analysis, role detection, interview question generation,
 * and answer evaluation using Groq's ultra-fast LLM inference.
 */
class GroqService {
  /**
   * Initialize Groq API client
   * @param {string} apiKey - Groq API key from environment variables
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Groq API key is required');
    }

    this.apiKey = apiKey;
    this.groq = new Groq({ apiKey });
    // Use Llama 3.3 70B - the latest supported model
    this.model = 'llama-3.3-70b-versatile';
  }

  /**
   * Get the initialized client instance
   * @returns {object} Groq client instance
   */
  getClient() {
    return this.groq;
  }

  /**
   * Check if the service is properly initialized
   * @returns {boolean} True if API key is set and client is initialized
   */
  isInitialized() {
    return !!(this.apiKey && this.groq);
  }

  /**
   * Analyze resume content using Groq AI
   * @param {string} extractedText - Raw resume text extracted from file
   * @param {object} parsedData - Structured resume data (skills, experience, education, etc.)
   * @returns {Promise<object>} Analysis results with atsScore, strengths, weaknesses, etc.
   */
  async analyzeResume(extractedText, parsedData) {
    try {
      console.log('🔍 Starting resume analysis with Groq...');
      console.log('📄 Resume text length:', extractedText.length);
      console.log('🎯 Skills found:', (parsedData.skills || []).length);

      const skillsList    = (parsedData.skills        || []).join(', ') || 'none listed';
      const expList       = (parsedData.experience    || []).map(e =>
        `${e.title || 'Role'} at ${e.company || 'Company'}${e.duration ? ' (' + e.duration + ')' : ''}${e.description ? ': ' + String(e.description).slice(0, 150) : ''}`
      ).join('\n') || 'none listed';
      const projectList   = (parsedData.projects      || []).map(p => {
        const pName = p.name || p.title || 'Project';
        const pTech = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
        return `${pName}${pTech ? ' (' + pTech + ')' : ''}${p.description ? ': ' + String(p.description).slice(0, 120) : ''}`;
      }).join('\n') || 'none listed';
      const eduList       = (parsedData.education     || []).map(e =>
        [e.degree, e.institution, e.year, e.gpa ? 'GPA: ' + e.gpa : ''].filter(Boolean).join(', ')
      ).join('\n') || 'none listed';
      const certList      = (parsedData.certifications || []).join(', ') || 'none listed';

      const prompt = `You are a strict, senior ATS resume reviewer. Analyze the EXACT resume text below and return a JSON object.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL RESUME TEXT (read every word carefully):
${extractedText.slice(0, 4000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARSED STRUCTURED DATA:
Skills: ${skillsList}
Experience: ${expList}
Projects: ${projectList}
Education: ${eduList}
Certifications: ${certList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCORING RULES — calculate atsScore (0–100) by checking ONLY what is ACTUALLY present in this resume:
+15 pts  — Has a professional summary/objective section
+15 pts  — Has quantifiable achievements (numbers, %, team size, time saved, revenue)
+15 pts  — Uses strong action verbs (Built, Developed, Led, Architected, Optimized, Delivered, Reduced, Increased...)
+10 pts  — Has 5+ relevant technical skills listed
+10 pts  — Has at least 1 work experience or internship entry
+10 pts  — Has at least 1 project with tech stack mentioned
+10 pts  — Has education section with degree and institution
+5 pts   — Has certifications
+5 pts   — Has contact info (email/phone)
+5 pts   — Consistent formatting (no obvious gaps, uniform bullet style)
DEDUCT:
-10 pts  — Uses passive/weak language ("responsible for", "helped with", "worked on", "assisted")
-10 pts  — No quantifiable metrics anywhere in the resume
-5 pts   — Missing professional summary
-5 pts   — Grammar or spelling errors detected

ANALYSIS RULES — be SPECIFIC to THIS resume, not generic:
- "strengths": List 4–5 things that are ACTUALLY good in this specific resume (mention real section names, real skills, real companies/projects found in the text)
- "weaknesses": List 4–5 ACTUAL problems found in this resume (quote or reference specific weak phrases, missing sections, or vague descriptions you actually see)
- "missingKeywords": List 6–10 keywords that are ABSENT from this resume but are important for the detected role (${parsedData.detectedRole || 'the candidate\'s field'})
- "suggestions": List 6–8 SPECIFIC, actionable fixes referencing actual content (e.g. "In your X project description, replace 'worked on backend' with 'Built REST APIs using Node.js that handled 500+ daily requests'")
- "grammarIssues": Quote actual grammar/spelling errors found in the text (empty array if none found)
- "formattingIssues": Describe actual formatting problems observed (empty array if none)
- "scoreBreakdown": object with these 4 keys, each an integer 0–100 scored independently:
    - "keywordMatch": how well the resume's skills/keywords match the detected role
    - "formatCompliance": how clean, consistent, and ATS-readable the formatting is
    - "contentQuality": quality of descriptions — specificity, action verbs, impact statements
    - "sectionCompleteness": how many standard resume sections are present and filled

Return ONLY valid JSON:
{
  "atsScore": <integer 0-100>,
  "scoreBreakdown": {
    "keywordMatch": <integer 0-100>,
    "formatCompliance": <integer 0-100>,
    "contentQuality": <integer 0-100>,
    "sectionCompleteness": <integer 0-100>
  },
  "strengths": ["specific strength referencing actual resume content", ...],
  "weaknesses": ["specific weakness referencing actual resume content", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "suggestions": ["specific actionable suggestion referencing actual content", ...],
  "grammarIssues": [],
  "formattingIssues": []
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a strict senior ATS resume reviewer. You ONLY comment on what is actually present or absent in the resume text provided. Never give generic advice. Always reference specific content from the resume. Respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        model: this.model,
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      console.log('✅ Groq API response received');

      const analysisData = JSON.parse(responseText);
      console.log('📊 ATS Score generated:', analysisData.atsScore);
      console.log('📊 Score breakdown:', analysisData.scoreBreakdown);

      return {
        atsScore:       analysisData.atsScore       || 50,
        scoreBreakdown: analysisData.scoreBreakdown || null,
        strengths:      analysisData.strengths      || [],
        weaknesses:     analysisData.weaknesses     || [],
        missingKeywords:analysisData.missingKeywords|| [],
        suggestions:    analysisData.suggestions    || [],
        grammarIssues:  analysisData.grammarIssues  || [],
        formattingIssues: analysisData.formattingIssues || []
      };
    } catch (error) {
      console.error('❌ Groq AI Analysis Error:', error.message);
      // Fallback uses actual parsed data so it's not completely generic
      const skills    = (parsedData.skills    || []);
      const projects  = (parsedData.projects  || []);
      const exp       = (parsedData.experience|| []);
      const hasQuant  = /\d+%|\d+ (users|requests|projects|clients|team|members|hours|days|months)/i.test(extractedText);
      const hasAction = /\b(built|developed|led|architected|optimized|delivered|reduced|increased|designed|implemented|created|launched)\b/i.test(extractedText);
      const hasSummary= /\b(summary|objective|profile|about)\b/i.test(extractedText);

      let score = 40;
      if (skills.length >= 5)  score += 10;
      if (exp.length > 0)      score += 10;
      if (projects.length > 0) score += 10;
      if (hasQuant)            score += 10;
      if (hasAction)           score += 10;
      if (hasSummary)          score += 5;

      const detectedStrengths = [];
      const detectedWeaknesses = [];

      if (skills.length >= 5)  detectedStrengths.push(`Lists ${skills.length} technical skills including ${skills.slice(0,3).join(', ')}`);
      if (projects.length > 0) detectedStrengths.push(`Includes ${projects.length} project(s): ${projects.map(p => p.name || p.title || 'Project').slice(0,2).join(', ')}`);
      if (exp.length > 0)      detectedStrengths.push(`Has work/internship experience: ${exp.map(e => e.title || 'Role').slice(0,2).join(', ')}`);
      if (hasAction)           detectedStrengths.push('Uses some action verbs in descriptions');
      if (detectedStrengths.length < 3) detectedStrengths.push('Education section is present');

      if (!hasQuant)           detectedWeaknesses.push('No quantifiable achievements found — add numbers, percentages, or impact metrics');
      if (!hasSummary)         detectedWeaknesses.push('Missing professional summary/objective section at the top');
      if (!hasAction)          detectedWeaknesses.push('Weak action verbs — replace "responsible for" and "worked on" with Built, Developed, Led, etc.');
      if (projects.length === 0) detectedWeaknesses.push('No projects section found — add at least 2 projects with tech stack');
      if (detectedWeaknesses.length < 3) detectedWeaknesses.push('Skill descriptions lack context — show how each skill was applied');

      return {
        atsScore: Math.min(score, 85),
        scoreBreakdown: null,
        strengths:       detectedStrengths,
        weaknesses:      detectedWeaknesses,
        missingKeywords: ['leadership', 'agile', 'CI/CD', 'REST API', 'cloud', 'testing', 'documentation'],
        suggestions: [
          `Add a 2-3 sentence professional summary at the top of your resume`,
          `Quantify your project impact — e.g. "Reduced load time by 40%" or "Served 200+ users"`,
          `Replace weak phrases like "worked on" or "helped with" with strong action verbs`,
          `Add tech stack details to every project description`,
          `Include any certifications, online courses, or awards`,
          `Ensure consistent date formatting across all sections`
        ],
        grammarIssues: [],
        formattingIssues: []
      };
    }
  }

  /**
   * Detect candidate role from resume data
   */
  async detectRole(parsedData) {
    try {
      const skills = (parsedData.skills || []).join(', ');
      const experience = (parsedData.experience || []).map(e => `${e.title || 'Position'} at ${e.company || 'Company'}`).join('; ');
      const education = (parsedData.education || []).map(e => e.degree || 'Degree').join(', ');

      const prompt = `Based on the following resume information, determine the most appropriate job role/title for this candidate. Return ONLY the role name as a plain string (e.g., "Software Engineer", "Data Scientist", "Product Manager", "Marketing Manager", etc.). Do not include any explanation or additional text.

Skills: ${skills || 'Not specified'}
Experience: ${experience || 'Not specified'}
Education: ${education || 'Not specified'}

Role:`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a career counselor. Respond with only the job role name, nothing else.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.5,
        max_tokens: 50
      });

      const responseText = completion.choices[0].message.content.trim();
      return responseText || 'Professional';
    } catch (error) {
      console.error('Groq AI Role Detection Error:', error.message);
      const skills = (parsedData.skills || []).map(s => s.toLowerCase());
      if (skills.some(s => s.includes('data') || s.includes('analytics'))) return 'Data Analyst';
      if (skills.some(s => s.includes('react') || s.includes('javascript') || s.includes('python'))) return 'Software Engineer';
      if (skills.some(s => s.includes('design') || s.includes('figma') || s.includes('ui'))) return 'UI/UX Designer';
      if (skills.some(s => s.includes('marketing') || s.includes('seo'))) return 'Marketing Specialist';
      return 'Professional';
    }
  }

  /**
   * Generate professional self-introduction modelled on a rich spoken-style reference.
   *
   * Reference style (Arjun Mehta example):
   *   Para 1 – Greeting + name + education (degree, college, CGPA/grade)
   *   Para 2 – Key project(s): name, tech stack, what it did / impact
   *   Para 3 – Internship / work experience: company, duration, tech used, contribution
   *   Para 4 – Core strengths + passion statement
   *   Para 5 – Closing: excitement about the role / company, career aspiration
   */
  async generateSelfIntroduction(parsedData, role) {
    try {
      const name        = parsedData.name        || 'the candidate';
      const skills      = (parsedData.skills      || []).slice(0, 12).join(', ');
      const experience  = (parsedData.experience  || []).slice(0, 4);
      const education   = (parsedData.education   || []).slice(0, 2);
      const projects    = (parsedData.projects    || []).slice(0, 4);
      const certifications = (parsedData.certifications || []).slice(0, 4).join(', ');

      // Build rich summaries so the model has enough detail to be specific
      const expDetail = experience.map(e =>
        `${e.title || 'Role'} at ${e.company || 'Company'}${e.duration ? ' (' + e.duration + ')' : ''}${e.description ? ': ' + e.description.slice(0, 120) : ''}`
      ).join('\n');

      const eduDetail = education.map(e =>
        [e.degree, e.institution, e.year, e.gpa ? 'GPA/CGPA: ' + e.gpa : ''].filter(Boolean).join(', ')
      ).join('\n');

      const projectDetail = projects.map(p => {
        // parser stores { title, description, technologies[] } — handle both shapes
        const pName = p.name || p.title || 'Project';
        const pTech = Array.isArray(p.technologies)
          ? p.technologies.join(', ')
          : (p.technologies || '');
        const pDesc = p.description ? p.description.trim().slice(0, 150) : '';
        return `${pName}${pTech ? ' (Tech: ' + pTech + ')' : ''}${pDesc ? ': ' + pDesc : ''}`;
      }).join('\n');

      const referenceExample = `Good morning! My name is Arjun Mehta. I recently completed my B.E. in Computer Science from PSG College of Technology, Coimbatore, with a CGPA of 8.6.

During my course, I worked on a full-stack project — an online food delivery platform built using React and Node.js, which handled real-time order tracking.

I also completed an internship at Zoho Corporation for two months, where I contributed to their CRM module using Java and REST APIs.

My core strengths are problem-solving and picking up new technologies quickly. I'm passionate about building clean, scalable software.

I'm excited about this opportunity at your company because I admire your focus on product innovation, and I believe this role is the perfect place to apply and grow my skills.`;

      const prompt = `You are an expert career coach. Generate a professional spoken self-introduction for a job interview.

REFERENCE STYLE (follow this structure and depth exactly):
${referenceExample}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE'S ACTUAL RESUME DATA:
Name: ${name}
Target Role: ${role}
Education: ${eduDetail || 'Not specified'}
Work Experience: ${expDetail || 'No work experience listed'}
Projects: ${projectDetail || 'No projects listed'}
Skills: ${skills || 'Not specified'}
Certifications: ${certifications || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRICT REQUIREMENTS:
1. Write EXACTLY 5 paragraphs, each 2-3 sentences, separated by blank lines
2. Paragraph 1: Greeting ("Good morning/afternoon!") + full name + education details (degree, college, year/CGPA if available)
3. Paragraph 2: Most impressive project — mention its NAME, the SPECIFIC technologies used, and what it achieved or solved
4. Paragraph 3: Work experience or internship — mention COMPANY NAME, duration, technologies used, and your specific contribution. If no experience, mention a second strong project or academic achievement instead.
5. Paragraph 4: 2-3 core personal strengths + a genuine passion statement relevant to the role
6. Paragraph 5: Closing — express enthusiasm for THIS role/company, and state your career goal
7. Use ONLY real data from the resume above — do NOT invent companies, projects, or grades
8. Write in first person, natural spoken English — warm, confident, not robotic
9. Be SPECIFIC: name actual technologies, actual companies, actual project names
10. Total length: 120–180 words

Generate the self-introduction now:`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach who writes compelling, specific, spoken-style interview self-introductions. Always use real resume data. Never invent details. Write naturally as if the candidate is speaking aloud.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.75,
        max_tokens: 600
      });

      const responseText = completion.choices[0].message.content.trim();

      // Sanity check — must have reasonable length
      if (responseText.length < 100) {
        return this.generateFallbackIntroduction(parsedData, role);
      }

      return responseText;
    } catch (error) {
      console.error('Groq AI Self-Introduction Error:', error.message);
      return this.generateFallbackIntroduction(parsedData, role);
    }
  }

  /**
   * Fallback introduction — mirrors the 5-paragraph reference style using resume data directly.
   */
  generateFallbackIntroduction(parsedData, role) {
    const name       = parsedData.name || 'I';
    const skills     = (parsedData.skills     || []).slice(0, 6);
    const experience = (parsedData.experience || []).slice(0, 2);
    const education  = (parsedData.education  || []).slice(0, 1);
    const projects   = (parsedData.projects   || []).slice(0, 2);

    // Helper: normalise a project object from either parser shape
    const normProject = (p) => ({
      name: p.name || p.title || 'Project',
      tech: Array.isArray(p.technologies)
        ? p.technologies.join(', ')
        : (p.technologies || ''),
      desc: (p.description || '').trim().slice(0, 120)
    });

    const paragraphs = [];

    // Para 1 — greeting + education
    const edu = education[0];
    if (edu) {
      const gpaStr  = edu.gpa  ? ` with a CGPA/GPA of ${edu.gpa}` : '';
      const yearStr = edu.year ? ` (${edu.year})` : '';
      paragraphs.push(
        `Good morning! My name is ${name}. I ${experience.length > 0 ? 'have' : 'recently'} completed my ${edu.degree || 'degree'} from ${edu.institution || 'a reputed institution'}${yearStr}${gpaStr}.`
      );
    } else {
      paragraphs.push(
        `Good morning! My name is ${name}. I am a passionate ${role} with a strong foundation in ${skills.slice(0, 3).join(', ') || 'modern technologies'}.`
      );
    }

    // Para 2 — key project
    const proj = projects[0] ? normProject(projects[0]) : null;
    if (proj) {
      const techStr = proj.tech ? ` using ${proj.tech}` : (skills.length > 0 ? ` using ${skills.slice(0, 3).join(', ')}` : '');
      const descStr = proj.desc ? ` — ${proj.desc}` : '';
      paragraphs.push(
        `During my studies, I built ${proj.name}${techStr}${descStr}. This project strengthened my ability to design and deliver end-to-end solutions.`
      );
    } else if (skills.length > 0) {
      paragraphs.push(
        `I have hands-on experience with ${skills.slice(0, 5).join(', ')}, which I applied through academic projects and self-driven development work.`
      );
    }

    // Para 3 — experience or second project
    const exp = experience[0];
    if (exp) {
      const durationStr = exp.duration ? ` for ${exp.duration}` : '';
      const descStr = exp.description
        ? ` where I ${exp.description.slice(0, 100)}`
        : ', where I contributed to key product features and collaborated with the engineering team';
      paragraphs.push(
        `I also completed an internship at ${exp.company || 'a leading company'} as a ${exp.title || role}${durationStr}${descStr}.`
      );
    } else if (projects[1]) {
      const p2 = normProject(projects[1]);
      const techStr = p2.tech ? ` built with ${p2.tech}` : '';
      paragraphs.push(
        `Another notable project is ${p2.name}${techStr}${p2.desc ? ': ' + p2.desc : ''}.`
      );
    }

    // Para 4 — strengths + passion
    const topSkills = skills.slice(0, 3).join(', ');
    paragraphs.push(
      `My core strengths are problem-solving, quick learning, and writing clean, maintainable code. I am passionate about building scalable ${role.toLowerCase()} solutions${topSkills ? ' using ' + topSkills : ''}.`
    );

    // Para 5 — closing
    paragraphs.push(
      `I am genuinely excited about this opportunity and believe my skills and enthusiasm make me a strong fit for this role. I look forward to contributing meaningfully and growing as a ${role}.`
    );

    return paragraphs.filter(Boolean).join('\n\n');
  }

  /**
   * @deprecated Use generateFallbackIntroduction instead
   */
  generateConciseFallbackIntroduction(parsedData, role) {
    return this.generateFallbackIntroduction(parsedData, role);
  }

  /**
   * Generate 20 interview questions structured as:
   *
   * SKILL BLOCK (10 questions):
   *   Q1–Q4   skill_technical   — core technical MCQs on candidate's skills
   *   Q5–Q7   skill_scenario    — scenario/situation questions based on skills
   *   Q8–Q10  skill_concept     — real-world concept questions derived from skills
   *
   * PROJECT BLOCK (6 questions):
   *   Q11–Q13 project_technical — technical MCQs on skills used inside projects
   *   Q14–Q16 project_scenario  — real-time scenario questions based on projects
   *
   * HR BLOCK (4 questions):
   *   Q17–Q18 hr_skill          — HR/behavioural questions about skills
   *   Q19–Q20 hr_project        — HR/behavioural questions about projects
   */
  async generateInterviewQuestions(role, parsedData) {
    try {
      const skills = (parsedData.skills || []).slice(0, 15).join(', ');
      const experience = (parsedData.experience || []).slice(0, 5).map(e =>
        `${e.title || 'Position'} at ${e.company || 'Company'}: ${e.description || 'Responsibilities included various tasks'}`
      ).join('\n');
      const projects = (parsedData.projects || []).slice(0, 5).map(p => {
        const pName = p.name || p.title || 'Project';
        const pTech = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
        return `${pName}${pTech ? ' (Tech: ' + pTech + ')' : ''}: ${p.description || 'Project details'}`;
      }).join('\n');
      const education = (parsedData.education || []).slice(0, 3).map(e =>
        `${e.degree || 'Degree'} from ${e.institution || 'Institution'} (${e.year || 'Year'})`
      ).join('; ');
      const certifications = (parsedData.certifications || []).join(', ');

      const hasResumeData = skills.length > 0 || experience.length > 0 || projects.length > 0;

      const prompt = `You are an expert technical interviewer for a ${role} position. Generate exactly 20 personalized MCQ interview questions based on the candidate's resume below.

CANDIDATE RESUME:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILLS: ${skills || 'Not specified'}
EXPERIENCE: ${experience || 'Not specified'}
PROJECTS: ${projects || 'Not specified'}
EDUCATION: ${education || 'Not specified'}
CERTIFICATIONS: ${certifications || 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENERATE EXACTLY 20 QUESTIONS IN THESE 7 CATEGORIES:

SKILL BLOCK — 10 questions total:
• "skill_technical" (4 questions): Core technical MCQs directly testing the candidate's listed skills. Reference specific skills by name. Test depth of knowledge.
• "skill_scenario" (3 questions): Situation-based questions — "You are building X using [skill], what would you do when...". Real workplace scenarios using their skills.
• "skill_concept" (3 questions): Real-world concept questions — test understanding of how their skills work in production systems, architecture decisions, best practices.

PROJECT BLOCK — 6 questions total:
• "project_technical" (3 questions): Technical MCQs about the specific technologies/skills used INSIDE their listed projects. Reference the actual project name and its tech stack.
• "project_scenario" (3 questions): Real-time scenario questions based on their actual projects — "In your [project name], if X happened, how would you handle it?".

HR BLOCK — 4 questions total:
• "hr_skill" (2 questions): Behavioural/HR questions about how they learned, applied, or grew with their skills. E.g. "Tell me about a time you used [skill] to solve a problem."
• "hr_project" (2 questions): Behavioural/HR questions about their project experience — teamwork, challenges faced, decisions made during the project.

RULES:
1. Every question MUST reference actual skills, project names, or technologies from the resume above
2. Each question has exactly 4 options (A, B, C, D) — only one is correct
3. Vary correct answers: use A, B, C, D roughly equally across all 20 questions
4. Options must be meaningfully different — no trick questions
5. Explanation must be 1-2 sentences explaining WHY the correct answer is right

Return ONLY valid JSON:
{
  "skill_technical":  [ { "question": "...", "options": ["A text","B text","C text","D text"], "correctAnswer": "B", "explanation": "..." }, ... ],
  "skill_scenario":   [ ... ],
  "skill_concept":    [ ... ],
  "project_technical":[ ... ],
  "project_scenario": [ ... ],
  "hr_skill":         [ ... ],
  "hr_project":       [ ... ]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Generate exactly 20 personalized interview questions in the specified 7 categories. Always respond with valid JSON only. Never invent skills or projects not in the resume.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.85,
        max_tokens: 7000,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      const qd = JSON.parse(responseText);

      // Normalise each question: ensure correctAnswer field is consistent
      const norm = (arr) => (arr || []).map(q => ({
        question:    q.question    || '',
        options:     q.options     || [],
        correctAnswer: (q.correctAnswer || q.correct || 'A').trim().toUpperCase(),
        explanation: q.explanation || ''
      }));

      const result = {
        skill_technical:   norm(qd.skill_technical),
        skill_scenario:    norm(qd.skill_scenario),
        skill_concept:     norm(qd.skill_concept),
        project_technical: norm(qd.project_technical),
        project_scenario:  norm(qd.project_scenario),
        hr_skill:          norm(qd.hr_skill),
        hr_project:        norm(qd.hr_project),
        // legacy aliases so existing code that reads .technical/.hr/.scenario still works
        technical: [
          ...norm(qd.skill_technical),
          ...norm(qd.skill_scenario),
          ...norm(qd.skill_concept),
          ...norm(qd.project_technical),
          ...norm(qd.project_scenario)
        ],
        hr:       norm(qd.hr_skill).concat(norm(qd.hr_project)),
        scenario: []
      };

      const total = result.skill_technical.length + result.skill_scenario.length +
                    result.skill_concept.length + result.project_technical.length +
                    result.project_scenario.length + result.hr_skill.length + result.hr_project.length;

      console.log(`✅ Generated ${total} questions for ${role}:`, {
        skill_technical:   result.skill_technical.length,
        skill_scenario:    result.skill_scenario.length,
        skill_concept:     result.skill_concept.length,
        project_technical: result.project_technical.length,
        project_scenario:  result.project_scenario.length,
        hr_skill:          result.hr_skill.length,
        hr_project:        result.hr_project.length
      });

      // If we got significantly fewer than 20, fall back
      if (total < 14) {
        console.warn('⚠️ Too few questions generated, using fallback');
        return this.generateFallbackQuestions(role, parsedData);
      }

      return result;
    } catch (error) {
      console.error('Groq AI Question Generation Error:', error.message);
      return this.generateFallbackQuestions(role, parsedData);
    }
  }

  /**
   * Fallback: 20 hardcoded questions matching the 7-category structure.
   * Used when the Groq API fails or returns too few questions.
   */
  generateFallbackQuestions(role, parsedData) {
    const skills  = parsedData.skills  || [];
    const projects = parsedData.projects || [];
    const experience = parsedData.experience || [];

    const s1 = skills[0] || role;
    const s2 = skills[1] || 'your secondary skill';
    const s3 = skills[2] || 'your tech stack';
    const s4 = skills[3] || 'your tools';
    const s5 = skills[4] || 'your framework';

    const normP = (p) => ({
      name: p.name || p.title || 'your project',
      tech: Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || s1),
      desc: (p.description || '').slice(0, 80)
    });

    const p1 = projects[0] ? normP(projects[0]) : { name: 'your main project', tech: s1, desc: '' };
    const p2 = projects[1] ? normP(projects[1]) : { name: 'your second project', tech: s2, desc: '' };
    const job = experience[0] || { title: role, company: 'your company' };

    // ── SKILL TECHNICAL (4) ──────────────────────────────────────────────
    const skill_technical = [
      {
        question: `Which of the following best describes the primary use of ${s1} in a ${role} workflow?`,
        options: [
          `${s1} is only used for UI styling`,
          `${s1} is used for building scalable, maintainable application logic and features`,
          `${s1} is a database management tool`,
          `${s1} is exclusively for testing purposes`
        ],
        correctAnswer: 'B',
        explanation: `${s1} is a core tool for ${role}s to build and maintain application features efficiently.`
      },
      {
        question: `When working with ${s2}, what is the recommended approach for managing application state?`,
        options: [
          'Store all state in global variables for easy access',
          'Use a centralised state management pattern with clear data flow and immutability',
          'Avoid state management entirely',
          'Duplicate state across every component'
        ],
        correctAnswer: 'B',
        explanation: `Centralised state management with clear data flow prevents bugs and makes ${s2} applications easier to debug and scale.`
      },
      {
        question: `What is the best practice for handling asynchronous operations in ${s3}?`,
        options: [
          'Use async/await or Promises with proper error handling and loading states',
          'Use synchronous blocking calls to keep code simple',
          'Ignore errors in async operations',
          'Run all async operations in a single thread without callbacks'
        ],
        correctAnswer: 'A',
        explanation: `Async/await with proper error handling ensures ${s3} applications remain responsive and handle failures gracefully.`
      },
      {
        question: `How would you optimise the performance of a ${role} application built with ${s4}?`,
        options: [
          'Load all resources upfront regardless of need',
          'Disable caching to always serve fresh data',
          'Increase server RAM without profiling the bottleneck',
          'Implement lazy loading, code splitting, caching, and minimise unnecessary re-renders'
        ],
        correctAnswer: 'D',
        explanation: `Lazy loading, code splitting, and caching are proven techniques to reduce load time and improve runtime performance in ${s4} applications.`
      }
    ];

    // ── SKILL SCENARIO (3) ───────────────────────────────────────────────
    const skill_scenario = [
      {
        question: `You are building a feature using ${s1} and the API starts returning inconsistent data. What do you do?`,
        options: [
          'Ship the feature and hope the API stabilises',
          'Remove the feature entirely',
          'Hard-code the expected values',
          'Add defensive validation, normalise the API response, add error boundaries, and notify the backend team'
        ],
        correctAnswer: 'D',
        explanation: `Defensive validation and clear communication with the backend team ensures the feature is robust even with unstable APIs.`
      },
      {
        question: `While using ${s2} in production, you notice a memory leak causing the app to slow down over time. What is your first step?`,
        options: [
          'Profile the application to identify the leak source, then fix the specific component or subscription causing it',
          'Restart the server every hour as a workaround',
          'Increase server memory and ignore the root cause',
          'Rewrite the entire module from scratch immediately'
        ],
        correctAnswer: 'A',
        explanation: `Profiling first identifies the exact source of the leak, allowing a targeted fix rather than a costly rewrite.`
      },
      {
        question: `Your team needs to integrate ${s3} with a third-party service that has rate limits. How do you handle this?`,
        options: [
          'Make unlimited requests and handle 429 errors by crashing',
          'Implement request queuing, exponential back-off retry logic, and caching to stay within rate limits',
          'Ignore rate limits since they rarely apply',
          'Switch to a different technology stack'
        ],
        correctAnswer: 'B',
        explanation: `Request queuing and exponential back-off are standard patterns for respecting rate limits while maintaining reliability.`
      }
    ];

    // ── SKILL CONCEPT (3) ────────────────────────────────────────────────
    const skill_concept = [
      {
        question: `In a production ${role} system using ${s4}, what is the purpose of a CI/CD pipeline?`,
        options: [
          'To automate building, testing, and deploying code changes, reducing human error and speeding up delivery',
          'To monitor server CPU usage only',
          'To manually deploy code once a month',
          'To replace version control systems'
        ],
        correctAnswer: 'A',
        explanation: `CI/CD pipelines automate the software delivery process, catching bugs early and enabling frequent, reliable releases.`
      },
      {
        question: `What does the principle of "separation of concerns" mean when architecting a ${role} application with ${s5}?`,
        options: [
          'Keep all logic in a single file for simplicity',
          'Mix UI, business logic, and data access in every component',
          'Separate concerns only applies to backend systems',
          'Divide the application into distinct layers (UI, business logic, data) so each has a single responsibility'
        ],
        correctAnswer: 'D',
        explanation: `Separation of concerns makes code easier to test, maintain, and scale by ensuring each module has one clear responsibility.`
      },
      {
        question: `Why is input validation critical in a ${role} application that uses ${s1}?`,
        options: [
          'Input validation prevents injection attacks, data corruption, and unexpected application behaviour',
          'It is only needed for forms, not APIs',
          'Validation slows down the application and should be avoided',
          'Validation is the database\'s responsibility, not the application\'s'
        ],
        correctAnswer: 'A',
        explanation: `Validating all inputs at every layer (client, server, database) is a fundamental security and data integrity practice.`
      }
    ];

    // ── PROJECT TECHNICAL (3) ────────────────────────────────────────────
    const project_technical = [
      {
        question: `In your "${p1.name}" project using ${p1.tech}, how would you implement authentication securely?`,
        options: [
          'Store passwords in plain text in the database',
          'Skip authentication since it adds complexity',
          'Use a single shared password for all users',
          'Use JWT tokens with short expiry, refresh token rotation, bcrypt password hashing, and HTTPS'
        ],
        correctAnswer: 'D',
        explanation: `JWT with refresh rotation and bcrypt hashing are industry-standard practices for secure authentication in ${p1.tech} applications.`
      },
      {
        question: `For the "${p1.name}" project, what database strategy would you use to handle concurrent read/write operations?`,
        options: [
          'Allow all operations without any concurrency control',
          'Process all requests sequentially in a single queue',
          'Use optimistic locking, connection pooling, and read replicas to handle concurrent operations efficiently',
          'Disable write operations during peak hours'
        ],
        correctAnswer: 'C',
        explanation: `Optimistic locking and connection pooling are proven strategies for maintaining data consistency under concurrent load.`
      },
      {
        question: `How would you add real-time features to your "${p2.name}" project built with ${p2.tech}?`,
        options: [
          'Poll the server every second with HTTP requests',
          'Use WebSockets or Server-Sent Events for efficient bidirectional or push-based real-time communication',
          'Reload the entire page every 5 seconds',
          'Real-time features are not possible with ${p2.tech}'
        ],
        correctAnswer: 'B',
        explanation: `WebSockets provide persistent connections for real-time data, far more efficient than polling for live updates.`
      }
    ];

    // ── PROJECT SCENARIO (3) ─────────────────────────────────────────────
    const project_scenario = [
      {
        question: `Your "${p1.name}" project goes viral and traffic increases 10x overnight. What is your scaling strategy?`,
        options: [
          'Implement horizontal scaling, load balancing, CDN for static assets, and database query optimisation',
          'Shut down the service until traffic normalises',
          'Upgrade to the most expensive server plan without analysis',
          'Ask users to try again later'
        ],
        correctAnswer: 'A',
        explanation: `Horizontal scaling with load balancing and CDN distribution is the standard approach for handling sudden traffic spikes.`
      },
      {
        question: `A critical security vulnerability is found in a dependency used by your "${p1.name}" project. What do you do immediately?`,
        options: [
          'Wait for the next scheduled release to patch it',
          'Remove the entire feature that uses the dependency',
          'Assess the impact, update or replace the dependency, run tests, and deploy a hotfix with a security advisory',
          'Ignore it if no users have reported issues'
        ],
        correctAnswer: 'C',
        explanation: `Immediate impact assessment followed by a tested hotfix is the responsible approach to security vulnerabilities in production.`
      },
      {
        question: `During the development of "${p2.name}", a team member's code breaks the main branch. How do you handle this?`,
        options: [
          'Ignore the broken build and continue adding features',
          'Delete the team member\'s commits permanently',
          'Revert the breaking commit, investigate the root cause, fix it in a feature branch, add tests, then re-merge after review',
          'Rebuild the entire project from scratch'
        ],
        correctAnswer: 'C',
        explanation: `Reverting, fixing in isolation, and re-merging after review is the standard Git workflow for handling broken builds safely.`
      }
    ];

    // ── HR SKILL (2) ─────────────────────────────────────────────────────
    const hr_skill = [
      {
        question: `How did you develop your proficiency in ${s1} and stay current with its ecosystem?`,
        options: [
          'I only learned what was needed for one project and stopped',
          'I copied code from Stack Overflow without understanding it',
          'I combined official documentation, personal projects, online courses, and community forums for continuous learning',
          'I relied entirely on colleagues to write ${s1} code for me'
        ],
        correctAnswer: 'C',
        explanation: `Continuous learning through multiple channels — docs, projects, and community — is the hallmark of a strong ${s1} practitioner.`
      },
      {
        question: `Describe a situation where your knowledge of ${s2} directly solved a difficult problem at work or in a project.`,
        options: [
          'I asked someone else to solve it using ${s2}',
          'I avoided the problem by switching to a different technology',
          'I have never used ${s2} to solve a real problem',
          'I identified a performance bottleneck, applied ${s2} best practices to refactor the solution, and reduced processing time significantly'
        ],
        correctAnswer: 'D',
        explanation: `Applying deep skill knowledge to diagnose and fix real problems demonstrates practical expertise beyond surface-level familiarity.`
      }
    ];

    // ── HR PROJECT (2) ───────────────────────────────────────────────────
    const hr_project = [
      {
        question: `What was the biggest technical challenge you faced while building "${p1.name}" and how did you overcome it?`,
        options: [
          'I gave up and reduced the project scope without trying to solve it',
          'I copied a solution from the internet without understanding it',
          'There were no challenges — the project was straightforward',
          'I identified the challenge early, researched solutions, prototyped alternatives, and implemented the best approach with team input'
        ],
        correctAnswer: 'D',
        explanation: `Proactively identifying challenges and systematically working through solutions demonstrates engineering maturity and problem-solving ability.`
      },
      {
        question: `If you were to rebuild "${p1.name}" today, what would you do differently and why?`,
        options: [
          'Nothing — the original implementation was perfect',
          'I would use a completely different programming language with no justification',
          'I would apply better architecture patterns, improve test coverage, optimise the database schema, and use more scalable infrastructure from the start',
          'I would remove features to make it simpler'
        ],
        correctAnswer: 'C',
        explanation: `Reflecting on past projects and identifying concrete improvements shows growth mindset and the ability to learn from experience.`
      }
    ];

    const result = {
      skill_technical,
      skill_scenario,
      skill_concept,
      project_technical,
      project_scenario,
      hr_skill,
      hr_project,
      // legacy aliases
      technical: [...skill_technical, ...skill_scenario, ...skill_concept, ...project_technical, ...project_scenario],
      hr:        [...hr_skill, ...hr_project],
      scenario:  []
    };

    console.log(`📝 Fallback: generated ${result.technical.length + result.hr.length} questions for ${role}`);
    return result;
  }

  /**
   * @deprecated — kept for backward compatibility, delegates to generateFallbackQuestions
   */
  generateEnhancedPersonalizedQuestions(role, parsedData) {
    return this.generateFallbackQuestions(role, parsedData);
  }

  /**
   * Enhance resume — rewrites every section, detects ACTUAL mistakes, returns before/after diff.
   * If jobDescription is provided, tailors everything to that specific JD.
   * @param {string} extractedText - raw resume text
   * @param {object} parsedData    - structured resume data
   * @param {string} role          - detected role
   * @param {string} [jobDescription] - optional job description text to tailor against
   */
  async enhanceResume(extractedText, parsedData, role, jobDescription = '') {
    try {
      const name  = parsedData.name  || 'Candidate';
      const skills = (parsedData.skills || []).join(', ');
      const experience = (parsedData.experience || []).map(e =>
        `${e.title || 'Role'} at ${e.company || 'Company'}${e.duration ? ' (' + e.duration + ')' : ''}${e.description ? ': ' + String(e.description).slice(0, 200) : ''}`
      ).join('\n');
      const projects = (parsedData.projects || []).map(p => {
        const pName = p.name || p.title || 'Project';
        const pTech = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
        return `${pName}${pTech ? ' (' + pTech + ')' : ''}${p.description ? ': ' + String(p.description).slice(0, 200) : ''}`;
      }).join('\n');
      const education = (parsedData.education || []).map(e =>
        `${e.degree || 'Degree'} from ${e.institution || 'Institution'}${e.year ? ' (' + e.year + ')' : ''}${e.gpa ? ', GPA: ' + e.gpa : ''}`
      ).join('\n');

      const hasJD = jobDescription && jobDescription.trim().length > 50;

      // Limit JD to 2000 chars so output tokens aren't starved
      const jdSection = hasJD ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET JOB DESCRIPTION (tailor the resume to match this EXACTLY):
${jobDescription.slice(0, 2000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : '';

      const tailorInstructions = hasJD ? `
JOB-DESCRIPTION TAILORING (CRITICAL — do this first):
0. Extract ALL required skills, tools, technologies, and keywords from the JD above
1. SUMMARY: Write a 3-sentence summary that DIRECTLY QUOTES language from the JD requirements
2. SKILLS: Put EVERY JD-required skill first; add any JD skills the candidate plausibly has
3. EXPERIENCE bullets: Naturally weave JD keywords into rewritten bullets for EVERY role
4. PROJECTS: Rewrite descriptions to highlight alignment with JD requirements
5. "jdKeywordsAdded": every JD keyword you injected
6. "jdKeywordsMissing": JD keywords genuinely absent from candidate's background` : `
GENERAL ENHANCEMENT RULES:
1. SUMMARY: 3 strong sentences packed with ${role}-specific ATS keywords
2. SKILLS: Group as Languages / Frameworks / Tools / Databases / Cloud&DevOps
3. EXPERIENCE: For EVERY bullet — replace weak verbs, add a metric or scale indicator
4. PROJECTS: Add impact sentence + specific tech keywords for every project`;

      const prompt = `You are a senior resume writer and ATS optimization expert. Rewrite every section of this resume with CONCRETE improvements — not surface-level tweaks.

CANDIDATE: ${name}  |  TARGET ROLE: ${role}
${jdSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL RESUME TEXT — extract every experience bullet, project detail, and skill from here:
${extractedText.slice(0, 6000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURED PARSED DATA (use as supplement — raw text above is primary source):
Skills: ${skills || 'Not specified'}
Experience: ${experience || 'Not specified'}
Projects: ${projects || 'Not specified'}
Education: ${education || 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${tailorInstructions}

MISTAKE DETECTION — find AT LEAST 5 real issues by scanning the raw text above:
- Quote exact weak phrases: "responsible for", "helped with", "worked on", "assisted in"
- Flag every bullet missing a number/metric/percentage/scale
- Flag vague project descriptions with no outcome or tech stack
- Flag a missing professional summary if none exists
- Flag passive or generic language anywhere
Each mistake MUST reference real text from the resume — NEVER invent examples.

REWRITING RULES — MANDATORY:
- EVERY experience bullet MUST start with a strong past-tense action verb (Built, Developed, Architected, Led, Reduced, Increased, Delivered, Optimised, Automated, Designed)
- EVERY bullet that currently has no number MUST gain one: use realistic estimates like "serving 500+ daily users", "reducing load time by 35%", "across a team of 8"
- Keep facts truthful — improve phrasing and add context, do NOT invent companies or degrees
- Produce AT LEAST 3 bullet points per experience entry
- Skills: Languages / Frameworks / Tools / Databases / Cloud&DevOps (omit empty categories)

Return ONLY valid JSON (no markdown, no code fences):
{
  "enhancedSections": {
    "summary": "Strong 3-sentence ATS-optimised summary...",
    "experience": [
      {
        "title": "job title exactly as in resume",
        "company": "company name exactly as in resume",
        "duration": "duration exactly as in resume",
        "bullets": [
          "• Action verb + what you did + measurable result",
          "• Action verb + what you did + measurable result",
          "• Action verb + what you did + measurable result"
        ]
      }
    ],
    "projects": [
      {
        "name": "project name exactly as in resume",
        "technologies": "comma-separated tech stack",
        "description": "2 sentences: what it does + measurable impact or scale"
      }
    ],
    "skills": {
      "Languages": ["list only if present in resume"],
      "Frameworks": ["list only if present"],
      "Tools": ["list only if present"],
      "Databases": ["list only if present"],
      "Cloud&DevOps": ["list only if present"]
    },
    "education": [
      {
        "degree": "exact degree",
        "institution": "exact institution",
        "year": "year",
        "gpa": "gpa or empty string"
      }
    ]
  },
  "mistakes": [
    {
      "section": "experience|projects|summary|skills|education|general",
      "original": "exact weak text quoted from the resume",
      "issue": "specific reason it is weak",
      "fixed": "the improved version you wrote",
      "severity": "high|medium|low"
    }
  ],
  ${hasJD ? '"jdKeywordsAdded": ["kw1", "kw2"],\n  "jdKeywordsMissing": ["gap1", "gap2"],' : ''}
  "improvementScore": <integer 60-98>,
  "summary": "2-sentence plain-English assessment of what changed and why it helps ATS"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a senior resume writer. Use ONLY real content from the resume. NEVER invent jobs, companies, or degrees. Every bullet must start with an action verb and include a metric. ${hasJD ? 'Inject every possible JD keyword truthfully.' : ''} Return valid JSON only — no markdown.`
          },
          { role: 'user', content: prompt }
        ],
        model: this.model,
        temperature: 0.4,
        max_tokens: 7000,
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(completion.choices[0].message.content);

      return {
        enhancedSections:   data.enhancedSections   || {},
        mistakes:           data.mistakes            || [],
        jdKeywordsAdded:    data.jdKeywordsAdded     || [],
        jdKeywordsMissing:  data.jdKeywordsMissing   || [],
        improvementScore:   data.improvementScore    || 75,
        summary:            data.summary             || 'Resume enhanced with stronger language and ATS keywords.',
        tailoredToJD:       hasJD
      };
    } catch (error) {
      console.error('Groq Resume Enhancement Error:', error.message);
      // Smart fallback: use actual parsed data so the PDF contains real content
      const skills = (parsedData.skills || []);
      const half   = Math.ceil(skills.length / 2);

      // Build real bullets from parsed description if available
      const makeBullets = (e) => {
        const desc = (e.description || '').split('|').map(s => s.trim()).filter(Boolean);
        if (desc.length > 0) {
          return desc.slice(0, 4).map(b => `• ${b.replace(/^[•\-\*]\s*/, '')}`);
        }
        const sk = skills.slice(0, 2).join(', ') || 'core technologies';
        return [
          `• Developed and maintained ${e.title || 'application'} features using ${sk}, delivering reliable and scalable solutions`,
          `• Collaborated with engineering team to implement improvements, reducing issues by an estimated 20%`,
          `• Wrote clean, tested code following best practices, improving maintainability across the codebase`
        ];
      };

      return {
        enhancedSections: {
          summary: `Results-driven ${role} with expertise in ${skills.slice(0, 4).join(', ') || 'modern technologies'}. Proven track record of building scalable, production-ready applications and delivering measurable improvements. Passionate about clean code, ATS-optimised documentation, and continuous professional growth.`,
          experience: (parsedData.experience || []).map(e => ({
            title:    e.title    || 'Software Engineer',
            company:  e.company  || '',
            duration: e.duration || '',
            bullets:  makeBullets(e)
          })),
          projects: (parsedData.projects || []).map(p => {
            const tech = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || skills.slice(0,3).join(', '));
            const desc = (p.description || '').trim();
            return {
              name: p.name || p.title || 'Project',
              technologies: tech,
              description: desc
                ? desc
                : `Built a full-featured ${p.name || p.title || 'application'} using ${tech || 'modern technologies'}, demonstrating end-to-end development capability and delivering a reliable user-facing product.`
            };
          }),
          skills: skills.length > 0
            ? { Languages: skills.slice(0, half), Frameworks: skills.slice(half) }
            : {},
          education: parsedData.education || []
        },
        mistakes: [
          { section: 'general', original: 'Unable to run full AI analysis', issue: 'AI service temporarily unavailable — fallback applied using your parsed resume data', fixed: 'Re-run enhancement once the service recovers for deep ATS rewrite', severity: 'low' }
        ],
        jdKeywordsAdded: [],
        jdKeywordsMissing: [],
        improvementScore: 65,
        summary: 'Fallback enhancement applied using your parsed resume data. Re-run for full AI-powered rewrite with quantified achievements.',
        tailoredToJD: false
      };
    }
  }
  async evaluateAnswer(question, answer, role, correctAnswer, explanation) {
    try {
      const userAnswer = String(answer).trim().toUpperCase();
      const correct = String(correctAnswer).trim().toUpperCase();
      const isCorrect = userAnswer === correct;

      const prompt = `You are evaluating an interview answer for a ${role} position.

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correct}
Explanation: ${explanation}

Provide constructive feedback on the user's answer. If correct, praise them and reinforce the concept. If incorrect, explain why the correct answer is better and provide learning points.

Return ONLY valid JSON with this structure:
{
  "isCorrect": ${isCorrect},
  "feedback": "Your detailed feedback here (2-3 sentences)",
  "score": ${isCorrect ? 10 : 0}
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an interview evaluator. Provide constructive feedback. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      const evaluationData = JSON.parse(responseText);

      return {
        isCorrect: evaluationData.isCorrect || isCorrect,
        feedback: evaluationData.feedback || (isCorrect ? `Correct! ${explanation || 'Well done!'}` : `Incorrect. The correct answer is ${correct}. ${explanation || ''}`),
        score: evaluationData.score || (isCorrect ? 10 : 0)
      };
    } catch (error) {
      console.error('Groq AI Answer Evaluation Error:', error.message);
      const userAnswer = String(answer).trim().toUpperCase();
      const correct = String(correctAnswer).trim().toUpperCase();
      const isCorrect = userAnswer === correct;
      return {
        isCorrect,
        feedback: isCorrect ? `Correct! ${explanation || 'Well done!'}` : `Incorrect. The correct answer is ${correct}. ${explanation || ''}`,
        score: isCorrect ? 10 : 0
      };
    }
  }
  /**
   * Analyze how well a resume matches a job description
   */
  async analyzeJobMatch(resumeText, jobDescriptionText, parsedSkills) {
    try {
      const skills = (parsedSkills || []).join(', ');

      const prompt = `You are an expert ATS recruiter and career coach. Analyze how well this resume matches the job description.

RESUME TEXT:
${resumeText.slice(0, 3000)}

CANDIDATE SKILLS: ${skills || 'Not specified'}

JOB DESCRIPTION:
${jobDescriptionText.slice(0, 3000)}

TASK:
1. Extract ALL keywords/skills/tools/technologies from the job description
2. Check which ones appear in the resume
3. Calculate a match percentage (0-100)
4. Identify skill gaps by category
5. Give specific, actionable suggestions referencing actual resume content

Return ONLY valid JSON:
{
  "matchScore": 78,
  "matchedKeywords": ["React", "Node.js", "REST API", "Git"],
  "missingKeywords": ["Docker", "Kubernetes", "AWS", "CI/CD"],
  "skillGap": {
    "technical": ["Docker", "AWS Lambda"],
    "tools": ["Kubernetes", "Jenkins"],
    "soft": ["Leadership", "Agile"],
    "domain": ["Microservices", "Cloud Architecture"]
  },
  "tailoredSuggestions": [
    "Add Docker containerization experience to your Food Delivery Platform project description",
    "Mention any CI/CD pipeline tools (GitHub Actions, Jenkins) used in your Zoho internship",
    "Add AWS or cloud deployment experience to your projects section",
    "Include TypeScript in your skills — the JD specifically requires it",
    "Quantify your Zoho internship impact with metrics (e.g., reduced API response time by X%)"
  ],
  "overallFit": "Good match — strong frontend skills align well. Main gaps are DevOps/cloud tools which are listed as preferred, not required.",
  "jobTitle": "detected job title from JD",
  "requiredSkillsCoverage": 65,
  "preferredSkillsCoverage": 45
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert ATS recruiter. Analyze resume-job description matches precisely. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        model: this.model,
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(completion.choices[0].message.content);
      return {
        matchScore:              data.matchScore              || 50,
        matchedKeywords:         data.matchedKeywords         || [],
        missingKeywords:         data.missingKeywords         || [],
        skillGap:                data.skillGap                || {},
        tailoredSuggestions:     data.tailoredSuggestions     || [],
        overallFit:              data.overallFit              || '',
        jobTitle:                data.jobTitle                || '',
        requiredSkillsCoverage:  data.requiredSkillsCoverage  || 0,
        preferredSkillsCoverage: data.preferredSkillsCoverage || 0
      };
    } catch (error) {
      console.error('Job Match Analysis Error:', error.message);
      return {
        matchScore: 50,
        matchedKeywords: parsedSkills || [],
        missingKeywords: [],
        skillGap: {},
        tailoredSuggestions: ['Could not fully analyze — please try again.'],
        overallFit: 'Analysis unavailable.',
        jobTitle: '',
        requiredSkillsCoverage: 0,
        preferredSkillsCoverage: 0
      };
    }
  }
}
if (process.env.NODE_ENV === 'test') {
  module.exports = GroqService;
} else {
  const groqService = new GroqService(process.env.GROQ_API_KEY);
  module.exports = {
    analyzeResume: groqService.analyzeResume.bind(groqService),
    detectRole: groqService.detectRole.bind(groqService),
    generateSelfIntroduction: groqService.generateSelfIntroduction.bind(groqService),
    generateInterviewQuestions: groqService.generateInterviewQuestions.bind(groqService),
    evaluateAnswer: groqService.evaluateAnswer.bind(groqService),
    enhanceResume: groqService.enhanceResume.bind(groqService),
    analyzeJobMatch: groqService.analyzeJobMatch.bind(groqService)
  };
}
