const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

// Database Helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { clients: [], pool: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { clients: [], pool: [] };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// --- MATCHMAKING ALGORITHMIC HEURISTICS ---
function calculateCompatibility(client, candidate) {
  if (client.gender === candidate.gender) {
    return { score: 0, reasons: ['Same gender profile (not matching)'], matchLevel: 'Low' };
  }

  let score = 0;
  const reasons = [];

  // MALE CLIENT COMPATIBILITY RULES
  if (client.gender === 'Male') {
    // Age Match
    const ageDiff = client.age - candidate.age;
    if (ageDiff > 0) {
      score += 25;
      reasons.push(`Candidate is younger (${candidate.age} yrs) than ${client.firstName} (${client.age} yrs).`);
    } else if (ageDiff === 0) {
      score += 15;
      reasons.push(`Candidate is the same age (${candidate.age} yrs).`);
    } else if (ageDiff >= -2) {
      score += 10;
      reasons.push(`Candidate is slightly older (${candidate.age} yrs).`);
    } else {
      score += 2;
      reasons.push(`Candidate is significantly older (${candidate.age} yrs).`);
    }

    // Height Match
    if (candidate.heightCm < client.heightCm) {
      score += 20;
      reasons.push(`Perfect height match: Candidate (${candidate.height}) is shorter than client (${client.height}).`);
    } else if (Math.abs(candidate.heightCm - client.heightCm) <= 3) {
      score += 10;
      reasons.push(`Similar height: Candidate is ${candidate.height} and client is ${client.height}.`);
    } else {
      score += 2;
      reasons.push(`Candidate (${candidate.height}) is taller than client (${client.height}).`);
    }

    // Income Match (Traditional check: male clients often prefer to match with women who do not earn more)
    if (candidate.income < client.income) {
      score += 20;
      reasons.push(`Candidate's income (₹${candidate.income} LPA) fits client's preference (< ₹${client.income} LPA).`);
    } else if (candidate.income === client.income) {
      score += 12;
      reasons.push(`Equivalent income level (₹${candidate.income} LPA).`);
    } else {
      score += 5;
      reasons.push(`Candidate's income (₹${candidate.income} LPA) is higher than client's (₹${client.income} LPA).`);
    }

    // Children Match
    if (client.wantKids === candidate.wantKids) {
      score += 15;
      reasons.push(`Aligned views on children: Both want "${client.wantKids}".`);
    } else if (client.wantKids === 'Maybe' || candidate.wantKids === 'Maybe') {
      score += 10;
      reasons.push(`Open views on children (Client: "${client.wantKids}", Partner: "${candidate.wantKids}").`);
    } else {
      reasons.push(`Conflict in children planning (Client: "${client.wantKids}", Partner: "${candidate.wantKids}").`);
    }

    // Cultural & Location Match
    if (client.diet === candidate.diet) {
      score += 10;
      reasons.push(`Matching dietary lifestyle: Both are "${client.diet}".`);
    } else if (client.diet === 'Veg' && candidate.diet === 'Non-Veg') {
      score += 2; // Penalty for vegetarian matching non-vegetarian
    } else {
      score += 6;
    }

    if (client.city === candidate.city) {
      score += 10;
      reasons.push(`Both reside in the same city: ${client.city}.`);
    } else if (candidate.openToRelocate === 'Yes' || candidate.openToRelocate === 'Maybe') {
      score += 8;
      reasons.push(`Candidate resides in ${candidate.city} but is open to relocating.`);
    }
  } 
  
  // FEMALE CLIENT COMPATIBILITY RULES
  else {
    // Career/Designation Alignment
    const techDesignations = ['Software Engineer', 'Senior Software Engineer', 'Technical Lead', 'Data Scientist', 'UI/UX Designer'];
    const bizDesignations = ['Product Manager', 'Senior Product Manager', 'Marketing Manager', 'Consultant', 'Senior Consultant', 'Founder', 'Brand Manager', 'Investment Banker'];
    
    const isClientTech = techDesignations.includes(client.designation);
    const isCandidateTech = techDesignations.includes(candidate.designation);
    const isClientBiz = bizDesignations.includes(client.designation);
    const isCandidateBiz = bizDesignations.includes(candidate.designation);

    if (client.designation === candidate.designation || (isClientTech && isCandidateTech) || (isClientBiz && isCandidateBiz)) {
      score += 25;
      reasons.push(`Highly compatible professional fields: both work in related ${isClientTech ? 'technology' : 'business'} roles.`);
    } else if (client.degree.slice(0, 3) === candidate.degree.slice(0, 3)) {
      score += 18;
      reasons.push(`Aligned academic backgrounds (Degrees: ${client.degree.split(' ')[0]} / ${candidate.degree.split(' ')[0]}).`);
    } else {
      score += 12;
      reasons.push(`Diverse professional backgrounds (Client: ${client.designation}, Candidate: ${candidate.designation}).`);
    }

    // Family Values Match
    if (client.familyValues === candidate.familyValues) {
      score += 20;
      reasons.push(`Perfect family values match: Both identify as "${client.familyValues}".`);
    } else if (
      (client.familyValues === 'Liberal' && candidate.familyValues === 'Moderate') ||
      (client.familyValues === 'Moderate' && candidate.familyValues === 'Liberal') ||
      (client.familyValues === 'Moderate' && candidate.familyValues === 'Traditional') ||
      (client.familyValues === 'Traditional' && candidate.familyValues === 'Moderate')
    ) {
      score += 15;
      reasons.push(`Highly compatible values: Client is "${client.familyValues}" and candidate is "${candidate.familyValues}".`);
    } else {
      score += 5;
      reasons.push(`Values gap: Client is "${client.familyValues}" and candidate is "${candidate.familyValues}".`);
    }

    // Relocation & Location Preference
    if (client.city === candidate.city) {
      score += 15;
      reasons.push(`Geographically aligned: Both are located in ${client.city}.`);
    } else if (client.openToRelocate === 'Yes' || candidate.openToRelocate === 'Yes') {
      score += 12;
      reasons.push(`Long-distance but open to relocation: Client is in ${client.city}, Candidate in ${candidate.city}.`);
    } else if (client.openToRelocate === 'Maybe' || candidate.openToRelocate === 'Maybe') {
      score += 8;
      reasons.push(`Different cities, relocation under consideration.`);
    } else {
      score += 0;
      reasons.push(`Relocation conflict: Both are in different cities and unwilling to relocate.`);
    }

    // Cultural, Caste & Astrological Match
    let culturalPoints = 0;
    if (client.religion === candidate.religion) {
      culturalPoints += 10;
      if (client.caste === candidate.caste) {
        culturalPoints += 5;
      }
    }
    
    if (client.manglik === candidate.manglik) {
      culturalPoints += 5;
      reasons.push(`Astrologically matched: Both have "${client.manglik}" Manglik status.`);
    } else if (client.manglik === 'No' && candidate.manglik === 'No') {
      culturalPoints += 5;
    } else if (client.manglik === 'Partial' || candidate.manglik === 'Partial') {
      culturalPoints += 3;
    } else {
      reasons.push(`Astrological check: Manglik status mismatch (Client: ${client.manglik}, Candidate: ${candidate.manglik}).`);
    }
    
    score += culturalPoints;
    if (culturalPoints >= 12) {
      reasons.push(`Strong cultural and religious compatibility (${client.religion} - ${candidate.caste}).`);
    }

    // Diet & Lifestyle Habits
    let lifestylePoints = 0;
    if (client.diet === candidate.diet) {
      lifestylePoints += 10;
      reasons.push(`Dietary alignment: Both are ${client.diet}.`);
    } else if (client.diet === 'Veg' && candidate.diet === 'Non-Veg') {
      lifestylePoints += 2;
    } else {
      lifestylePoints += 6;
    }

    if (client.smoke === 'No' && candidate.smoke === 'No') {
      lifestylePoints += 5;
    }
    if (client.drink === 'No' && candidate.drink === 'No') {
      lifestylePoints += 5;
    } else if (client.drink === 'Socially' && (candidate.drink === 'Socially' || candidate.drink === 'Occasionally')) {
      lifestylePoints += 5;
    }

    score += lifestylePoints;
  }

  score = Math.max(0, Math.min(100, score));

  let matchLevel = 'Low';
  if (score >= 82) {
    matchLevel = 'High';
  } else if (score >= 60) {
    matchLevel = 'Moderate';
  }

  return { score, reasons, matchLevel };
}

// --- API ENDPOINTS ---

// Get active clients list
app.get('/api/clients', (req, res) => {
  const db = readDb();
  res.json(db.clients);
});

// Get pool list
app.get('/api/pool', (req, res) => {
  const db = readDb();
  res.json(db.pool);
});

// Calculate Matches for a specific Client
app.get('/api/clients/:id/matches', (req, res) => {
  const db = readDb();
  const client = db.clients.find(c => c.id === req.params.id);
  
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  // Filter opposite gender pool candidates
  const oppositePool = db.pool.filter(p => p.gender !== client.gender);

  const scoredMatches = oppositePool.map(candidate => {
    const matchResult = calculateCompatibility(client, candidate);
    return {
      ...candidate,
      matchResult
    };
  }).sort((a, b) => b.matchResult.score - a.matchResult.score);

  res.json(scoredMatches);
});

// Update Journey Stage
app.put('/api/clients/:id/stage', (req, res) => {
  const { stage } = req.body;
  if (!stage) {
    return res.status(400).json({ error: 'Stage is required' });
  }

  const db = readDb();
  const clientIndex = db.clients.findIndex(c => c.id === req.params.id);

  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const client = db.clients[clientIndex];
  const timestamp = new Date().toISOString().split('T')[0];
  const auditNote = {
    date: timestamp,
    text: `Matchmaker changed journey stage to: "${stage}".`
  };

  client.stage = stage;
  client.notes = [auditNote, ...(client.notes || [])];

  db.clients[clientIndex] = client;
  writeDb(db);

  res.json(client);
});

// Add CRM Note
app.post('/api/clients/:id/notes', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const db = readDb();
  const clientIndex = db.clients.findIndex(c => c.id === req.params.id);

  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const client = db.clients[clientIndex];
  const timestamp = new Date().toISOString().split('T')[0];
  const newNote = {
    date: timestamp,
    text: text.trim()
  };

  client.notes = [newNote, ...(client.notes || [])];

  db.clients[clientIndex] = client;
  writeDb(db);

  res.json(client);
});

// Generate proposal email intro (AI OpenAI gpt-4o-mini or Local NLG)
app.post('/api/match/email', async (req, res) => {
  const { client, match, apiKey } = req.body;

  if (!client || !match) {
    return res.status(400).json({ error: 'Client and match details are required' });
  }

  const finalKey = apiKey || process.env.OPENAI_API_KEY;

  if (finalKey && finalKey.trim().startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert matchmaker at TDC (The Date Crew). Your task is to write a highly polished, warm, professional, and personalized email introduction presenting a potential match to a client. The email should highlight key areas of compatibility (location, career, values, lifestyle) while maintaining a respectful and exciting matrimonial tone. Do not use placeholders, sign off as "Your TDC Matchmaker".'
            },
            {
              role: 'user',
              content: `Write an email to our client ${client.fullName} presenting a match with ${match.fullName}.
              
              Client Profile:
              - Name: ${client.fullName} (Gender: ${client.gender}, Age: ${client.age})
              - Occupation: ${client.designation} at ${client.company}
              - Education: ${client.degree} from ${client.college}
              - Religion/Caste: ${client.religion} (${client.caste})
              - Diet: ${client.diet}
              - City: ${client.city}
              - Bio summary: ${client.bio}
              
              Suggested Match Profile:
              - Name: ${match.fullName} (Gender: ${match.gender}, Age: ${match.age}, Height: ${match.height})
              - Occupation: ${match.designation} at ${match.company} (Income: ${match.income} LPA)
              - Education: ${match.degree} from ${match.college}
              - Religion/Caste: ${match.religion} (${match.caste})
              - Diet: ${match.diet}
              - City: ${match.city}
              - Bio summary: ${match.bio}
              
              Explain why this is a great fit (e.g. they both live in ${client.city === match.city ? client.city : 'compatible cities'}, work in aligned sectors, share similar family values, etc.). Keep the tone personalized and premium.`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const data = await response.json();
      return res.json({ email: data.choices[0].message.content, mode: 'OpenAI GPT-4o-mini' });
    } catch (error) {
      console.error('Error invoking OpenAI backend API, using local generator fallback:', error);
    }
  }

  // Local fallback email text generator
  const clientFirstName = client.firstName;
  const matchFirstName = match.firstName;
  const matchFullName = match.fullName;

  const maleClientTemplate = `Subject: Highly Compatible Match: Introducing ${matchFirstName} for your review

Dear ${clientFirstName},

I hope this email finds you well. 

I am excited to share a profile from our verified pool that aligns exceptionally well with your background, values, and lifestyle preferences. I have personally reviewed her details and believe she is a high-potential connection for you.

Introducing ${matchFullName}, a ${match.age}-year-old ${match.designation} at ${match.company} based in ${match.city}. She is an alumna of ${match.college}, holding a ${match.degree}, and is currently established at ${match.income} LPA.

Here is why we believe this is a strong fit:

1. Professional & Educational Alignment: You both have solid academic foundations from premium institutes (${client.college} & ${match.college}) and are well-established in your respective careers.
2. Lifestyle & Cultural Compatibility: You both share a ${client.diet.toLowerCase()} diet and come from families with ${match.familyValues.toLowerCase()} values. Her astrological status (${match.manglik === 'No' ? 'Non-Manglik' : match.manglik + ' Manglik'}) is also highly compatible.
3. Geographical Alignment: ${client.city === match.city ? `Since you both live in ${client.city}, scheduling a casual meeting over coffee will be seamless.` : `While she is based in ${match.city}, she is open to relocation preferences, making long-term planning very feasible.`}

In her bio, she describes herself as: "${match.bio}"

I have attached her full detailed biodata below. Please take a look and let me know if you would like me to share your profile with her to initiate a mutual match. If you both agree, I will proceed to coordinate an introductory date.

Warm regards,

Your Matchmaking Specialist
The Date Crew (TDC) Team`;

  const femaleClientTemplate = `Subject: Highly Compatible Match: Introducing ${matchFirstName} for your review

Dear ${clientFirstName},

I hope you are having a wonderful week.

I have been searching our verified database for matches that fit your career ambitions, values, and relocation preferences. I am delighted to present a profile that represents a wonderful compatibility fit.

Introducing ${matchFullName}, a ${match.age}-year-old ${match.designation} at ${match.company} based in ${match.city}. He completed his ${match.degree} from ${match.college} and is currently earning ${match.income} LPA.

We have ranked this profile highly for you due to several key factors:

1. Professional Alignment: With your background as a ${client.designation} and his role as a ${match.designation}, you will find plenty of shared interests, career understanding, and intellectual synergy.
2. Value Integration: Both of your profiles show a strong preference for a ${client.familyValues.toLowerCase()} household structure and aligned views on children and lifestyle.
3. Astrological Harmony: He is a ${match.manglik === 'No' ? 'Non-Manglik' : match.manglik + ' Manglik'}, which corresponds perfectly with your preferences.
4. Location & Pets: ${client.city === match.city ? `You are both based in ${client.city}, allowing for an easy first meeting.` : `He is located in ${match.city} but is open to your relocation preferences.`} He is also ${match.openToPets === 'Yes' ? 'pet-friendly' : 'mindful of lifestyle preferences'}.

He is described as: "${match.bio}"

Please review his details and let me know if we have your green light to share your profile with him. Once we have mutual consent, we will arrange a meeting.

Best regards,

Your Matchmaking Specialist
The Date Crew (TDC) Team`;

  const emailText = client.gender === 'Male' ? maleClientTemplate : femaleClientTemplate;
  res.json({ email: emailText, mode: 'Local NLG Engine' });
});

// Record Sent Match Suggestion
app.post('/api/match/send', (req, res) => {
  const { clientId, matchCandidate } = req.body;

  if (!clientId || !matchCandidate) {
    return res.status(400).json({ error: 'Client ID and Match Candidate details are required' });
  }

  const db = readDb();
  const clientIndex = db.clients.findIndex(c => c.id === clientId);

  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const client = db.clients[clientIndex];
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Calculate match compatibility score
  const matchResult = calculateCompatibility(client, matchCandidate);

  const newNote = {
    date: timestamp,
    text: `Suggested match sent: ${matchCandidate.fullName} (${matchCandidate.age}, ${matchCandidate.designation} in ${matchCandidate.city}). Compatibility Score: ${matchResult.score}%.`
  };

  client.notes = [newNote, ...(client.notes || [])];
  db.clients[clientIndex] = client;
  writeDb(db);

  res.json(client);
});

// Start Server
app.listen(PORT, () => {
  console.log(`TDC Matchmaker API Backend server running on port ${PORT}`);
});
