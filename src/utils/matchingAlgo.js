// TDC Matchmaker Portal - Heuristic Compatibility Algorithm & AI Intro Generator

/**
 * Calculates compatibility between an active client and a candidate.
 * 
 * @param {Object} client - The active client profile.
 * @param {Object} candidate - The matchmaking pool profile.
 * @returns {Object} { score, reasons, matchLevel }
 */
export function calculateCompatibility(client, candidate) {
  // 1. Same-gender safety check (for heterosexual matching context of this MVP pool)
  if (client.gender === candidate.gender) {
    return { score: 0, reasons: ['Same gender profile (not matching)'], matchLevel: 'Low' };
  }

  let score = 0;
  const reasons = [];

  // --- MALE CLIENT MATCHING LOGIC ---
  // Heuristic: Younger, earns less, shorter, and matching views on children
  if (client.gender === 'Male') {
    // A. Age Heuristic (Max 25 pts)
    const ageDiff = client.age - candidate.age;
    if (ageDiff > 0) {
      score += 25;
      reasons.push(`Candidate is younger (${candidate.age} yrs) than Amit (${client.age} yrs).`);
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

    // B. Height Heuristic (Max 20 pts)
    if (candidate.heightCm < client.heightCm) {
      score += 20;
      reasons.push(`Perfect height match: Candidate (${candidate.height}) is shorter than Amit (${client.height}).`);
    } else if (Math.abs(candidate.heightCm - client.heightCm) <= 3) {
      score += 10;
      reasons.push(`Similar height: Candidate is ${candidate.height} and Amit is ${client.height}.`);
    } else {
      score += 2;
      reasons.push(`Candidate (${candidate.height}) is taller than Amit (${client.height}).`);
    }

    // C. Income Heuristic (Max 20 pts)
    if (candidate.income < client.income) {
      score += 20;
      reasons.push(`Candidate's income (${candidate.income} LPA) fits Amit's preference (< ${client.income} LPA).`);
    } else if (candidate.income === client.income) {
      score += 12;
      reasons.push(`Equivalent income level (${candidate.income} LPA).`);
    } else {
      score += 5;
      reasons.push(`Candidate's income (${candidate.income} LPA) is higher than Amit's (${client.income} LPA).`);
    }

    // D. Kids Heuristic (Max 15 pts)
    if (client.wantKids === candidate.wantKids) {
      score += 15;
      reasons.push(`Aligned views on children: Both want "${client.wantKids}".`);
    } else if (client.wantKids === 'Maybe' || candidate.wantKids === 'Maybe') {
      score += 10;
      reasons.push(`Open views on children (Amit: "${client.wantKids}", Partner: "${candidate.wantKids}").`);
    } else {
      score += 0;
      reasons.push(`Conflict in children planning (Amit: "${client.wantKids}", Partner: "${candidate.wantKids}").`);
    }

    // E. Cultural & Location Compatibility (Max 20 pts)
    // Diet
    if (client.diet === candidate.diet) {
      score += 10;
      reasons.push(`Matching dietary lifestyle: Both are "${client.diet}".`);
    } else if (client.diet === 'Veg' && candidate.diet === 'Non-Veg') {
      score += 2; // Penalty for strict Veg matching Non-Veg
    } else {
      score += 6;
    }

    // Location
    if (client.city === candidate.city) {
      score += 10;
      reasons.push(`Both reside in the same city: ${client.city}.`);
    } else if (candidate.openToRelocate === 'Yes' || candidate.openToRelocate === 'Maybe') {
      score += 8;
      reasons.push(`Candidate resides in ${candidate.city} but is open to relocating.`);
    }
  }

  // --- FEMALE CLIENT MATCHING LOGIC ---
  // Heuristic: Thoughtful compatibility on profession, values, relocation, diet, culture, habits
  else {
    // A. Profession & Education Compatibility (Max 25 pts)
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

    // B. Family Values (Max 20 pts)
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

    // C. Relocation Preferences (Max 15 pts)
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

    // D. Cultural, Religion & Horoscope matching (Max 20 pts)
    let culturalPoints = 0;
    if (client.religion === candidate.religion) {
      culturalPoints += 10;
      if (client.caste === candidate.caste) {
        culturalPoints += 5;
      }
    }
    
    // Manglik Matching
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

    // E. Diet & Lifestyle Habits (Max 20 pts)
    let lifestylePoints = 0;
    
    // Diet match
    if (client.diet === candidate.diet) {
      lifestylePoints += 10;
      reasons.push(`Dietary alignment: Both are ${client.diet}.`);
    } else if (client.diet === 'Veg' && candidate.diet === 'Non-Veg') {
      lifestylePoints += 2;
    } else {
      lifestylePoints += 6;
    }

    // Habits match
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

  // Ensure score stays between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Match Level
  let matchLevel = 'Low';
  if (score >= 82) {
    matchLevel = 'High';
  } else if (score >= 60) {
    matchLevel = 'Moderate';
  }

  return {
    score,
    reasons,
    matchLevel
  };
}

/**
 * Generates a personalized introductory email from the matchmaker to the client.
 * Supports a local heuristic builder as a fallback, and real OpenAI if key is provided.
 * 
 * @param {Object} client - The active client.
 * @param {Object} match - The suggested match candidate.
 * @param {string} [apiKey] - Optional OpenAI API key.
 * @returns {Promise<string>} The generated email draft.
 */
export async function generateEmailIntro(client, match, apiKey) {
  // If OpenAI API key is provided, execute a real API call
  if (apiKey && apiKey.trim().startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating with OpenAI, falling back to local generator:', error);
      // Fall through to local generator on error
    }
  }

  // LOCAL HEURISTIC INTRO GENERATOR (Stunningly detailed fallback)
  const clientFirstName = client.firstName;
  const matchFirstName = match.firstName;
  const matchFullName = match.fullName;
  
  const greeting = `Subject: Highly Compatible Match: Introducing ${matchFirstName} for your review

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

  const femaleGreeting = `Subject: Highly Compatible Match: Introducing ${matchFirstName} for your review

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

  return client.gender === 'Male' ? greeting : femaleGreeting;
}
