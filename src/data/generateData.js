const fs = require('fs');
const path = require('path');

// Indian Names data (strictly categorized)
const maleFirstNames = [
  'Aarav', 'Vihaan', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh',
  'Aaryan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Kabir', 'Arav', 'Arnav', 'Rohan', 'Dhruv',
  'Dev', 'Rahul', 'Varun', 'Karan', 'Rithvik', 'Siddharth', 'Pranav', 'Nikhil', 'Manish', 'Kunal',
  'Yash', 'Rishi', 'Neil', 'Armaan', 'Rudra', 'Aryan', 'Samar', 'Ishwar', 'Aniket', 'Ayush',
  'Vikram', 'Rajesh', 'Sanjay', 'Gaurav', 'Abhishek', 'Mayank', 'Harsh', 'Tushar', 'Alok', 'Deepak',
  'Madhav', 'Piyush', 'Shashank', 'Pratyush', 'Chinmay', 'Kartik', 'Sameer', 'Prateek', 'Hardik', 'Gautam'
];

const femaleFirstNames = [
  'Aanya', 'Aadhya', 'Ananya', 'Diya', 'Priya', 'Kavya', 'Aditi', 'Riya', 'Aaradhya',
  'Ira', 'Avani', 'Myra', 'Anika', 'Aisha', 'Zara', 'Pooja', 'Neha', 'Sneha', 'Shruti',
  'Meera', 'Ridhima', 'Kriti', 'Tanya', 'Simran', 'Ishita', 'Divya', 'Anjali', 'Deepika', 'Priyanka',
  'Sonam', 'Alia', 'Kiara', 'Kareena', 'Sanya', 'Tanvi', 'Shreya', 'Prisha', 'Nisha', 'Shalini',
  'Radhika', 'Nandini', 'Gauri', 'Jahnavi', 'Kiran', 'Vidya', 'Swati', 'Preeti', 'Komal', 'Sonia',
  'Saisha', 'Esha', 'Rutuja', 'Payal', 'Bhavana', 'Drishti', 'Rupal', 'Kajal', 'Ishani', 'Manasi'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Shah', 'Joshi', 'Trivedi', 'Iyer', 'Iyengar',
  'Nair', 'Pillai', 'Reddy', 'Rao', 'Choudhury', 'Sen', 'Das', 'Chatterjee', 'Mukherjee', 'Banerjee',
  'Singh', 'Kaur', 'Grover', 'Malhotra', 'Kapoor', 'Khanna', 'Bhasin', 'Sodhi', 'Gill', 'Arora',
  'Bahl', 'Dubey', 'Pandey', 'Mishra', 'Tripathi', 'Dwivedi', 'Shukla', 'Tiwari', 'Bhatt', 'Desai',
  'Kulkarni', 'Deshmukh', 'Patil', 'Chavan', 'Jadhav', 'Shinde', 'Agarwal', 'Bansal', 'Goyal', 'Mittal'
];

const cities = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Delhi', state: 'NCR' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Gurgaon', state: 'NCR' },
  { name: 'Noida', state: 'NCR' }
];

const colleges = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kharagpur', 'BITS Pilani',
  'Delhi Technological University', 'RV College of Engineering', 'COEP Pune',
  'SRCC Delhi', 'LSR Delhi', 'St. Xavier\'s College Mumbai', 'Christ University Bangalore',
  'IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'ISB Hyderabad',
  'FMS Delhi', 'Symbiosis Pune', 'NMIMS Mumbai', 'MIT Manipal'
];

const degrees = [
  'B.Tech in Computer Science', 'B.Tech in Electronics', 'Dual Degree (B.Tech + M.Tech)',
  'MBA in Finance', 'MBA in Marketing', 'MBBS', 'M.Tech', 'MS in Computer Science',
  'B.Com (Hons)', 'B.Sc in Economics', 'B.Des in UI/UX', 'MCA', 'BBA', 'LLB'
];

const companies = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'TCS', 'Infosys', 'Wipro',
  'Cognizant', 'Deloitte', 'McKinsey & Company', 'Boston Consulting Group',
  'Goldman Sachs', 'J.P. Morgan', 'HDFC Bank', 'ICICI Bank', 'Flipkart', 'Zomato',
  'Swiggy', 'Uber', 'Ola', 'Reliance Industries', 'Tata Motors'
];

const designations = [
  'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Senior Product Manager',
  'Data Scientist', 'Business Analyst', 'Consultant', 'Senior Consultant', 'Investment Banker',
  'Marketing Manager', 'UI/UX Designer', 'HR Specialist', 'Operations Manager',
  'Technical Lead', 'Founder / Entrepreneur', 'Finance Controller', 'Brand Manager'
];

const religionsAndCastes = {
  'Hindu': ['Brahmin', 'Kshatriya', 'Vaishya', 'Kayastha', 'Iyer', 'Iyengar', 'Nair', 'Reddy', 'Patel', 'Maratha', 'Agarwal', 'Gupta', 'Saraswat'],
  'Sikh': ['Jat Sikh', 'Khatri', 'Arora', 'Ramgarhia'],
  'Christian': ['Roman Catholic', 'Protestant', 'Syrian Christian'],
  'Jain': ['Oswal', 'Agarwal Jain', 'Digambar', 'Svetambar'],
  'Muslim': ['Sunni', 'Shia']
};

const languages = ['Hindi', 'English', 'Punjabi', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

const diets = ['Veg', 'Non-Veg', 'Eggetarian', 'Jain'];
const familyValues = ['Liberal', 'Moderate', 'Traditional', 'Orthodox'];
const optionsYesNoMaybe = ['Yes', 'No', 'Maybe'];
const manglikStatus = ['No', 'Yes', 'Partial'];
const habits = ['No', 'Yes', 'Socially', 'Occasionally'];

// Random item helper
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random range helper
function getRandomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate height in Cm and Ft
function generateHeight() {
  const heightCm = getRandomRange(150, 192); // 4'11" to 6'3"
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return {
    cm: heightCm,
    ft: `${feet}'${inches}"`
  };
}

// Generate Date of Birth based on Age
function generateDob(age) {
  const currentYear = 2026;
  const birthYear = currentYear - age;
  const month = String(getRandomRange(1, 12)).padStart(2, '0');
  const day = String(getRandomRange(1, 28)).padStart(2, '0');
  return `${birthYear}-${month}-${day}`;
}

// Generate realistic Indian phone number
function generatePhone() {
  const prefixes = ['98', '99', '97', '88', '81', '70', '95'];
  const prefix = getRandom(prefixes);
  const rest = Array.from({ length: 8 }, () => getRandomRange(0, 9)).join('');
  return `+91 ${prefix}${rest.slice(0, 4)}-${rest.slice(4)}`;
}

// Generate bio summary
function generateBio(name, gender, age, religion, designation, city) {
  const templates = [
    `Hi, I'm ${name}. I'm a ${age}-year-old ${designation} based in ${city}. I value family connections, continuous learning, and exploring new cuisines. Looking for a partner who is career-oriented yet family-minded.`,
    `I am an ambitious, down-to-earth person who loves traveling and working out. As a ${designation} in ${city}, my life is exciting, and I'm seeking someone with whom I can share life's adventures.`,
    `Raised in a moderate ${religion} household, I balance traditional respect with a modern outlook. I work as a ${designation} and enjoy weekend hikes, reading, and listening to classical music. Looking for a compatible soulmate.`,
    `Hello! I describe myself as caring, independent, and goal-oriented. I enjoy my career in ${city} and love playing badminton and cooking in my spare time. Looking to connect with someone who shares similar values.`
  ];
  return getRandom(templates);
}

// Generate individual profile
function generateProfile(id, forceGender = null, forceAge = null) {
  const gender = forceGender || (Math.random() > 0.5 ? 'Male' : 'Female');
  const age = forceAge || getRandomRange(24, 36);
  const dob = generateDob(age);
  const heightObj = generateHeight();
  
  const firstName = gender === 'Male' ? getRandom(maleFirstNames) : getRandom(femaleFirstNames);
  const lastName = getRandom(lastNames);
  const fullName = `${firstName} ${lastName}`;
  
  const cityObj = getRandom(cities);
  const religion = getRandom(Object.keys(religionsAndCastes));
  const caste = getRandom(religionsAndCastes[religion]);
  
  // Salary ranges based on age and designation
  let income = getRandomRange(6, 18);
  if (age > 28) income = getRandomRange(15, 30);
  if (age > 32) income = getRandomRange(25, 60);

  const degree = getRandom(degrees);
  const college = getRandom(colleges);
  const company = getRandom(companies);
  const designation = getRandom(designations);

  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomRange(10, 99)}@gmail.com`;
  const phone = generatePhone();
  
  const selectedLanguages = Array.from(new Set(['English', 'Hindi', getRandom(languages)]));

  // Deterministic, high-quality human faces from RandomUser portraits
  const portraitId = (id % 95) + 1; // Keep within 1-95 range
  const photo = gender === 'Male'
    ? `https://randomuser.me/api/portraits/men/${portraitId}.jpg`
    : `https://randomuser.me/api/portraits/women/${portraitId}.jpg`;

  return {
    id: `profile-${id}`,
    firstName,
    lastName,
    fullName,
    gender,
    dob,
    age,
    height: heightObj.ft,
    heightCm: heightObj.cm,
    email,
    phone,
    college,
    degree,
    income, // in LPA
    company,
    designation,
    maritalStatus: Math.random() > 0.9 ? getRandom(['Divorced', 'Widowed']) : 'Never Married',
    languagesKnown: selectedLanguages,
    siblings: getRandomRange(0, 3),
    religion,
    caste,
    wantKids: getRandom(optionsYesNoMaybe),
    openToRelocate: getRandom(optionsYesNoMaybe),
    openToPets: getRandom(optionsYesNoMaybe),
    manglik: getRandom(manglikStatus),
    familyValues: getRandom(familyValues),
    diet: getRandom(diets),
    smoke: getRandom(habits),
    drink: getRandom(habits),
    bio: generateBio(firstName, gender, age, religion, designation, cityObj.name),
    city: cityObj.name,
    state: cityObj.state,
    country: 'India',
    verified: true,
    photo
  };
}

// Write file
const main = () => {
  // Let's create the active clients explicitly with gender-accurate photos
  const activeClients = [
    {
      id: 'client-1',
      firstName: 'Amit',
      lastName: 'Sharma',
      fullName: 'Amit Sharma',
      gender: 'Male',
      dob: '1996-04-12',
      age: 30,
      height: '5\'11"',
      heightCm: 180,
      email: 'amit.sharma96@gmail.com',
      phone: '+91 98101-23456',
      college: 'IIT Delhi',
      degree: 'B.Tech in Computer Science',
      income: 28, // LPA
      company: 'Google',
      designation: 'Senior Software Engineer',
      maritalStatus: 'Never Married',
      languagesKnown: ['Hindi', 'English', 'Punjabi'],
      siblings: 1,
      religion: 'Hindu',
      caste: 'Brahmin',
      wantKids: 'Yes',
      openToRelocate: 'Maybe',
      openToPets: 'Yes',
      manglik: 'No',
      familyValues: 'Moderate',
      diet: 'Veg',
      smoke: 'No',
      drink: 'Socially',
      bio: 'I am a software professional raised in New Delhi, working at Google. I value intellect, compassion, and family integrity. Looking for a partner who is well-educated, enjoys conversation, and appreciates a balanced life.',
      city: 'Delhi',
      state: 'NCR',
      country: 'India',
      stage: 'Matchmaking Active',
      notes: [
        { date: '2026-05-15', text: 'Onboarded. Expressed strong preference for Veg or Eggetarian. Wants a partner in the Delhi-NCR region.' },
        { date: '2026-05-28', text: 'Called to update status. Open to looking at matches from Bangalore or Mumbai if she is willing to relocate.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 'client-2',
      firstName: 'Kabir',
      lastName: 'Singh',
      fullName: 'Kabir Singh',
      gender: 'Male',
      dob: '1993-08-22',
      age: 33,
      height: '6\'0"',
      heightCm: 183,
      email: 'kabir.singh93@yahoo.com',
      phone: '+91 99112-98765',
      college: 'BITS Pilani',
      degree: 'MBA in Finance',
      income: 42, // LPA
      company: 'Self-Employed (Wealth Management)',
      designation: 'Founder',
      maritalStatus: 'Never Married',
      languagesKnown: ['Hindi', 'English', 'Punjabi'],
      siblings: 2,
      religion: 'Sikh',
      caste: 'Khatri',
      wantKids: 'Yes',
      openToRelocate: 'No',
      openToPets: 'Maybe',
      manglik: 'No',
      familyValues: 'Liberal',
      diet: 'Non-Veg',
      smoke: 'No',
      drink: 'Socially',
      bio: 'Entrepreneur based in South Mumbai, passionate about fintech, fitness, and global travel. I balance an active professional life with meditation and family values. Looking for an independent, smart female partner.',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      stage: 'Feedback Stage',
      notes: [
        { date: '2026-05-10', text: 'Presented three profiles. He liked two, rejected one because of a high relocation mismatch.' },
        { date: '2026-06-01', text: 'Had a call post-first date. Said conversation went well but did not feel the romantic spark. Requested next set of profiles.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/men/44.jpg'
    },
    {
      id: 'client-3',
      firstName: 'Rohan',
      lastName: 'Nair',
      fullName: 'Rohan Nair',
      gender: 'Male',
      dob: '1999-11-05',
      age: 27,
      height: '5\'9"',
      heightCm: 175,
      email: 'rohan.nair99@outlook.com',
      phone: '+91 88203-12457',
      college: 'MIT Manipal',
      degree: 'B.Des in UI/UX',
      income: 16, // LPA
      company: 'Flipkart',
      designation: 'UI/UX Designer',
      maritalStatus: 'Never Married',
      languagesKnown: ['English', 'Malayalam', 'Hindi', 'Tamil'],
      siblings: 0,
      religion: 'Hindu',
      caste: 'Nair',
      wantKids: 'Maybe',
      openToRelocate: 'Yes',
      openToPets: 'Yes',
      manglik: 'No',
      familyValues: 'Liberal',
      diet: 'Non-Veg',
      smoke: 'Occasionally',
      drink: 'Socially',
      bio: 'Design nerd, amateur photographer, and dog lover based in Bangalore. I enjoy indie cinema, long drives, and indie rock music. Looking for a partner who is passionate about her career and creative in outlook.',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      stage: 'Onboarding',
      notes: [
        { date: '2026-06-03', text: 'Onboarding completed today. Verified documents (Aadhar, College degree, Payslip). Set preferences: Open to relocate, pet-friendly is a must.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/men/51.jpg'
    },
    {
      id: 'client-4',
      firstName: 'Priya',
      lastName: 'Patel',
      fullName: 'Priya Patel',
      gender: 'Female',
      dob: '1998-02-14',
      age: 28,
      height: '5\'4"',
      heightCm: 163,
      email: 'priya.patel98@gmail.com',
      phone: '+91 97177-33445',
      college: 'NMIMS Mumbai',
      degree: 'MBA in Marketing',
      income: 20, // LPA
      company: 'Nykaa',
      designation: 'Brand Manager',
      maritalStatus: 'Never Married',
      languagesKnown: ['English', 'Gujarati', 'Hindi'],
      siblings: 1,
      religion: 'Hindu',
      caste: 'Patel',
      wantKids: 'Yes',
      openToRelocate: 'Yes',
      openToPets: 'Yes',
      manglik: 'No',
      familyValues: 'Moderate',
      diet: 'Veg',
      smoke: 'No',
      drink: 'Occasionally',
      bio: 'Active, cheerful marketer living in Mumbai. I enjoy reading self-growth books, trying out new cafes, and practicing yoga. Family values are very important to me. Seeking an understanding, ambitious partner.',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      stage: 'Matchmaking Active',
      notes: [
        { date: '2026-05-20', text: 'Prefers a partner who is vegetarian or open to vegetarian food at home. Family is looking for a groom from Hindu-Patel or allied castes but open to others.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/women/32.jpg'
    },
    {
      id: 'client-5',
      firstName: 'Meera',
      lastName: 'Iyer',
      fullName: 'Meera Iyer',
      gender: 'Female',
      dob: '1995-07-30',
      age: 31,
      height: '5\'2"',
      heightCm: 157,
      email: 'meera.iyer95@gmail.com',
      phone: '+91 98401-99887',
      college: 'Stella Maris College Chennai',
      degree: 'M.Sc in Biotechnology',
      income: 14, // LPA
      company: 'IIT Madras Research Park',
      designation: 'Research Scientist',
      maritalStatus: 'Never Married',
      languagesKnown: ['Tamil', 'English', 'Hindi', 'French'],
      siblings: 2,
      religion: 'Hindu',
      caste: 'Iyer',
      wantKids: 'Yes',
      openToRelocate: 'No',
      openToPets: 'No',
      manglik: 'No',
      familyValues: 'Traditional',
      diet: 'Veg',
      smoke: 'No',
      drink: 'No',
      bio: 'I am a simple, intellectual individual working in biotechnology research. I love reading, carnatic music, and cultural events. Looking for an educated partner with similar traditional and moral values.',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      stage: 'First Date Scheduled',
      notes: [
        { date: '2026-05-18', text: 'Expressed strict preference for South Indian Brahmin (Iyer/Iyengar/Saraswat). Does not drink or smoke.' },
        { date: '2026-05-30', text: 'Assigned a match with a software professional. Date scheduled for June 7th in Chennai.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 'client-6',
      firstName: 'Simran',
      lastName: 'Kaur',
      fullName: 'Simran Kaur',
      gender: 'Female',
      dob: '1997-09-18',
      age: 29,
      height: '5\'6"',
      heightCm: 168,
      email: 'simran.kaur97@outlook.com',
      phone: '+91 95015-77665',
      college: 'Symbiosis Pune',
      degree: 'MBA in Human Resources',
      income: 15, // LPA
      company: 'Cognizant',
      designation: 'HR Lead',
      maritalStatus: 'Never Married',
      languagesKnown: ['Punjabi', 'Hindi', 'English'],
      siblings: 1,
      religion: 'Sikh',
      caste: 'Arora',
      wantKids: 'Yes',
      openToRelocate: 'Maybe',
      openToPets: 'Yes',
      manglik: 'No',
      familyValues: 'Moderate',
      diet: 'Non-Veg',
      smoke: 'No',
      drink: 'Socially',
      bio: 'Enthusiastic and outgoing person. I work as an HR Lead in Pune and love dancing, sketching, and volunteering. Looking for a partner who is respectful, well-established, and loves laughing.',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      stage: 'Matchmaking Active',
      notes: [
        { date: '2026-05-22', text: 'Looking for a clean-shaven or turbaned Sikh partner. Prefers Pune, Mumbai, or Delhi.' }
      ],
      verified: true,
      photo: 'https://randomuser.me/api/portraits/women/51.jpg'
    }
  ];

  const pool = [];
  // Generate 105 pool profiles (52 males and 53 females)
  for (let i = 1; i <= 52; i++) {
    pool.push(generateProfile(i, 'Male'));
  }
  for (let i = 53; i <= 105; i++) {
    pool.push(generateProfile(i, 'Female'));
  }

  const fileContent = `// Mock Data for clients and matchmaking pool
// Generated automatically for Date Crew Matchmaker Dashboard

export const initialClients = ${JSON.stringify(activeClients, null, 2)};

export const initialPool = ${JSON.stringify(pool, null, 2)};
`;

  fs.mkdirSync(path.dirname(path.join(__dirname, 'profiles.js')), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'profiles.js'), fileContent);
  console.log('Successfully generated 6 clients and 105 pool profiles in profiles.js with gender-accurate avatars!');

  // Generate database for Express backend
  const dbPath = path.join(__dirname, '..', '..', 'backend', 'data', 'db.json');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify({ clients: activeClients, pool: pool }, null, 2));
  console.log('Successfully generated backend database in backend/data/db.json!');
};

main();
