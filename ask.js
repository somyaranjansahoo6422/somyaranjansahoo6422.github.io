/* "Ask me anything": a small chat that answers questions about me from my resume, this site and my public
   profiles. Everything runs in the visitor's browser: the questions never leave the page.
   It forgives spelling mistakes, chat shorthand and broken grammar, remembers the topic for follow-ups,
   and when it has no answer it points to me, my profiles and my resume instead of showing an error. */
(function () {
  'use strict';

  var EMAIL = '6422somyaranjansahoo@gmail.com';
  // Year of study, worked out from the August 2025 start so these answers never go stale.
  var YEAR = (function () {
    var d = new Date(), y = d.getFullYear() - 2025 + (d.getMonth() >= 7 ? 1 : 0);
    return ['1st', '2nd', '3rd', '4th'][Math.min(Math.max(y, 1), 4) - 1];
  })();
  var L = {
    contact: { href: '#contact', label: 'Message me' },
    resume: { href: '#resume', label: 'My resume' },
    work: { href: '#work', label: 'My projects' },
    linkedin: { href: 'https://www.linkedin.com/in/somya-ranjan-sahoo-109599312/', label: 'LinkedIn', ext: 1 },
    github: { href: 'https://github.com/somyaranjansahoo6422', label: 'GitHub', ext: 1 },
    instagram: { href: 'https://www.instagram.com/somya_ranjan__22/', label: 'Instagram', ext: 1 },
    experience: { href: '#experience', label: 'Experience' },
    credentials: { href: '#credentials', label: 'Certificates' },
    journey: { href: '#journey', label: 'Hackathon map' },
    about: { href: '#about', label: 'About me' }
  };
  function P(id, label) { return { href: '#project/' + id, label: label || 'Open the case study' }; }

  // k: strong keywords or phrases, w: weak hints. a: the answer, more: what "tell me more" gives.
  var T = [
    // ---- who I am ----
    { id: 'name', k: ['name', 'called', 'full name'], a: 'I’m Somya Ranjan Sahoo. Friends call me Sonu.', more: 'I’m a Computer Science student at GITA Autonomous College in Bhubaneswar, and I build software and hackathon projects with my team, ASTRA-X.', go: [L.about], next: ['What do you do?', 'Where do you study?'] },
    { id: 'identity', k: ['introduce', 'yourself', 'about you', 'somya', 'sonu', 'sahoo', 'summary', 'bio', 'profile', 'background', 'overview'], w: ['about'], a: 'I’m Somya Ranjan Sahoo (Sonu), a B.Tech Computer Science student at GITA Autonomous College, Bhubaneswar, and a software developer working with Python, Node.js and SQL, on my way to becoming a data analyst. I’ve done two Python internships, I’m a national hackathon finalist, and my team won Best Innovation Team at CHAKRAVYUH 1.0.', more: 'I grew up in uniform: seven years at Sainik School Bhubaneswar with NCC training. That’s where I learned to prepare properly, own my part of a team and finish what I start. My GitHub bio says it shortest: “I break things, I build things.”', go: [L.about, L.resume], next: ['What’s your career goal?', 'What are your best projects?', 'Any internships?', 'Why should we hire you?'] },
    { id: 'role', k: ['profession', 'occupation', 'designation', 'job title', 'developer', 'engineer', 'programmer', 'coder'], a: 'I’m an aspiring data analyst, a software developer and a ' + YEAR + '-year B.Tech Computer Science student. I build with Python, Node.js and SQL, from computer vision and data to the web and hardware prototypes.', go: [L.work], next: ['What are your skills?', 'Which projects?'] },
    { id: 'location', k: ['location', 'live', 'living', 'city', 'based', 'hometown', 'native', 'stay', 'staying', 'odisha', 'where from', 'you from', 'country', 'state', 'bhubaneswar'], a: 'I’m based in Bhubaneswar, Odisha, India.', go: [L.contact], next: ['Are you open to remote work?', 'Where do you study?'] },
    { id: 'hobbies', k: ['hobby', 'hobbies', 'interest', 'interests', 'free time', 'spare time', 'fun', 'cycling', 'travel', 'travelling', 'traveling', 'sport', 'sports', 'cricket', 'football', 'music', 'sing', 'singing', 'basketball', 'running', 'marathon', 'weekend', 'weekends', 'enjoy'], a: 'Outside code I like exploring new tech, cycling and travelling. As my GitHub says, if I’m not coding I’m probably exploring the world. At school I ran two mini marathons, played basketball and sang in the school group song.', more: 'Most weekends I’m building with my hackathon team, ASTRA-X. You can also find me on Instagram.', go: [L.instagram], next: ['Tell me about your school', 'What’s your team?'] },
    { id: 'personality', k: ['personality', 'nature', 'character', 'kind of person', 'introvert', 'extrovert', 'teacher', 'teachers', 'remark', 'remarks', 'humble', 'describe', 'behaviour', 'behavior', 'attitude'], a: 'My Class XII class teacher wrote: “An introvert but has got river of thoughts. Lively, humble, a pure soul. Well behaved and can excel in life.” My Class VI teacher wrote just: “Self-motivated.”', go: [L.about], next: ['What are your strengths?', 'What do others say about you?'] },
    { id: 'strengths', k: ['strength', 'strengths', 'good at', 'best at', 'soft skill', 'soft skills', 'communication', 'qualities', 'quality', 'weakness', 'weaknesses'], a: 'The strengths people have put in writing: the Director of The Entrepreneurship Network called me organized, reliable and able to work independently, with excellent communication skills. I also make things work end to end, plan for things breaking, and I’m exact about what I built versus what the team built. As for weaknesses, ask me in an interview and I’ll give you an honest answer.', go: [L.experience], next: ['Why should we hire you?', 'What’s your work style?'] },
    { id: 'motto', k: ['motto', 'quote', 'philosophy', 'principle', 'principles', 'belief', 'believe', 'mantra', 'tagline', 'slogan', 'mindset', 'life lesson', 'thinking'], a: 'On my site it’s “I build things that work.” On GitHub: “I break things, I build things.” On Instagram: “Trust, but verify.” And the way I work: make it work end to end, plan for things breaking, and be exact about my part.', more: 'I believe that once you know the backend of anything, a project or even something in real life, the next path gets easier. You can make yourself understood and understand others, and then you improve with your own thoughts and their suggestions.', go: [L.about], next: ['Why should we hire you?'] },
    { id: 'workstyle', k: ['work style', 'how do you work', 'how you work', 'approach', 'process', 'methodology', 'how do you build', 'how you build'], a: 'Three rules: make it work end to end, plan for things breaking, and be exact about my part. On team projects I say what I built and credit the team for the rest.', go: [L.about], next: ['What’s the hardest problem you solved?'] },
    { id: 'whyhire', k: ['why hire', 'hire you', 'why should', 'why choose', 'why select', 'stand out', 'different', 'unique', 'value', 'asset', 'recruit'], w: ['hire'], a: 'I ship things that work: a live 3D game, a computer-vision toll system, a wearable that won Best Innovation Team, and back-end services that held up at a national final. Two internships ended well, including a letter of recommendation calling me “a tremendous asset”. And seven years of Sainik School discipline means I finish what I start.', go: [L.work, L.contact], next: ['Are you available?', 'What do others say about you?'] },
    { id: 'testimonials', k: ['recommendation', 'recommend', 'reference', 'references', 'testimonial', 'testimonials', 'lor', 'letter', 'others say', 'people say', 'feedback', 'review', 'kamlesh', 'director'], a: 'Kamlesh Gupta, Director of The Entrepreneurship Network, wrote: “Somya Ranjan Sahoo would be a tremendous asset to your Company and has my highest recommendation.” InternPe’s certificate calls me “a sincere and dedicated intern with a professional attitude.” Other references are available on request.', go: [L.experience], next: ['Any internships?', 'Why should we hire you?'] },

    // ---- my goal and how I got here ----
    { id: 'goal', k: ['goal', 'goals', 'aim', 'ambition', 'dream', 'career', 'future', 'vision', 'plan', 'plans', 'aspiration', 'five years', '5 years', 'want to be', 'want to become', 'become', 'target', 'data analyst', 'analyst'], a: 'My main goal is to become a data analyst. Right now I’m also focused on becoming a good all-round software engineer, with at least a working knowledge of every part of technology.', more: 'That’s why I completed the Google Data Analysis with Python specialization, and why I keep polishing my SQL. The engineering side helps too: I want to understand how the data gets built, moved and used, not just how to read it.', go: [L.credentials, L.work], next: ['Do you know SQL?', 'Why did you choose computer science?'] },
    { id: 'data', k: ['data analysis', 'data analytics', 'data science', 'analytics', 'analysis', 'data skills', 'visualisation', 'visualization', 'dashboard', 'dashboards', 'data project', 'data lab', 'data cleaning', 'jupyter', 'playground', 'toll analysis'], a: 'Data analysis is where I’m heading. I completed the six-course Google Data Analysis with Python specialization, and I’ve worked with Python and MySQL since Class XI. My Data lab has a real analysis of India’s toll network: 2,003 plazas cleaned with pandas and queried in SQL. It found that four states hold 53.6% of all plazas, and there’s an Excel dashboard of the same data. My recommendation is to start any toll-spacing review in Rajasthan, Uttar Pradesh, Madhya Pradesh and Haryana.', more: 'I fixed or flagged 159 records, including 8 plazas placed 650–1,770 km outside their own state. The Data lab also has charts of my own numbers and a live SQL database you can query in your browser.', go: [{ href: '#data', label: 'Open the Data lab' }, L.credentials], next: ['What’s your career goal?', 'Do you know SQL?'] },
    { id: 'story', k: ['passion', 'passionate', 'motivation', 'motivates', 'motivate', 'inspire', 'inspired', 'inspiration', 'why computer', 'why cs', 'choose', 'chose', 'chosen', 'choose computer', 'chose computer', 'love computer', 'love computers', 'like computers', 'love coding', 'love programming', 'love technology', 'love tech', 'field', 'this field', 'how did you start', 'when did you start', 'start coding', 'started coding', 'start programming', 'started programming', 'since when', 'how long', 'your journey', 'your story', 'first computer'], a: 'Computers have been part of my life since Class VI, when Computer Science was my additional subject, and I took it again in Class XI and XII. I love sitting in front of that big screen and building, changing, deleting and rebuilding whatever I want on it, a bit like being a god of my own little world. So for me it’s a passion, not just a way to earn.', more: 'From Class VI I picked up the basics of HTML, CSS and JavaScript. In Class XI and XII I started Python and MySQL, and I’m still improving at both. Computer science is a real partner in my life now.', go: [L.about], next: ['What’s your career goal?', 'Which projects?'] },

    { id: 'backend', k: ['backend', 'back end', 'server', 'server side', 'api', 'apis', 'rest api', 'rest apis', 'full stack', 'fullstack', 'microservice', 'microservices'], a: 'I’ve learned the backend by doing it, through hackathons and projects rather than only courses: Node.js along the way, FastAPI for the GOD VIEW data ingestion, and Python as a Back-End / Python Developer Intern at TEN. And I’ll keep going, because the backend is what makes everything else make sense.', more: 'I believe that once you know the backend of anything, a project or even something in real life, the next path gets easier. You can make yourself understood and understand others, and then you improve with your own thoughts and their suggestions.', go: [P('godview'), L.experience], next: ['Do you know Node.js?', 'What’s your career goal?'] },

    { id: 'lessons', k: ['proof of work', 'lesson', 'lessons', 'learned', 'learnt', 'advice', 'job hunt', 'job search', 'team sport', 'real world', 'realisation', 'realization'], a: 'Two big ones. Proof of work cuts right through the noise: working prototypes did more for me than generic job applications. And building software is a team sport: technical skill is just table stakes, and what counts is whether you can explain your trade-offs and build things other people can use.', go: [L.work, L.linkedin], next: ['What’s your work style?', 'Why should we hire you?'] },
    { id: 'funfact', k: ['fun fact', 'funfact', 'streak', 'linkedin games', 'puzzle', 'puzzles', 'consistency', 'consistent', 'habit', 'habits', 'surprise me', 'interesting'], a: 'I hit a 100-day win streak on LinkedIn’s daily games and unlocked the “INVINCIBLE” badge: 102 plays, a 100% win rate and a best time of 9 seconds. Small daily habits build momentum.', go: [L.linkedin], next: ['What are your hobbies?', 'What’s your career goal?'] },

    // ---- education ----
    { id: 'education', k: ['study', 'studies', 'studying', 'college', 'university', 'education', 'educational', 'degree', 'btech', 'b.tech', 'graduate', 'graduation', 'graduating', 'qualification', 'qualifications', 'gita', 'cse', 'computer science', 'branch', 'semester', 'batch', 'passing', 'pass out', 'student', 'engineering'], a: 'I’m in the ' + YEAR + ' year of a B.Tech in Computer Science & Engineering at GITA Autonomous College, Bhubaneswar (2025–2029). Before that I spent seven years at Sainik School Bhubaneswar, with Class X and XII in 1st Division.', more: 'At GITA, my activities include Smart India Hackathon 2025 and 2026 and the CHAKRAVYUH 1.0 National Hackathon, where my team won Best Innovation Team.', go: [{ href: '#experience', label: 'Education' }], next: ['Tell me about your school', 'Are you available for internships?'] },
    { id: 'school', k: ['school', 'sainik', 'schooling', 'class 10', 'class 12', 'class x', 'class xii', 'childhood', 'ssb', 'early life', 'tenth', 'twelfth', '10th', '12th'], a: 'I studied at Sainik School Bhubaneswar from Class VI to XII (2018–2025), a residential school under the Ministry of Defence, finishing Class X and XII in 1st Division. Early mornings, inspections and NCC training taught me to prepare properly and finish what I start.', more: 'At school I also earned the Junior Software Developer certificate (NSQF Level 3, Grade A, 450 hours), joined the G20 Student-Scientist Connect Program and ran two mini marathons.', go: [{ href: '#experience', label: 'Education' }], next: ['Tell me about NCC', 'What do your teachers say?'] },
    { id: 'ncc', k: ['ncc', 'cadet', 'army', 'navy', 'defence', 'defense', 'military', 'nda', 'leadership', 'leader', 'discipline', 'disciplined'], a: 'I was an NCC cadet at Sainik School: the ‘A’ Certificate in the Navy wing (Grade A, 2022) and the ‘B’ Certificate in the Army wing (2025), plus an Annual Training Camp. It’s where my discipline and team-first habits come from.', more: 'NCC taught me that real leadership starts with self-discipline, and that individual effort only matters when it strengthens the whole team. The 10-day Annual Training Camp in December 2024 pushed that further, and I carry the same habit into demanding technical sprints.', go: [L.credentials], next: ['Tell me about your school', 'What’s your team?'] },

    // ---- experience ----
    { id: 'internships', k: ['intern', 'interns', 'internship', 'internships', 'experience', 'experienced', 'worked at', 'worked in', 'have you worked', 'employment', 'company', 'companies', 'training', 'work history', 'ten', 'entrepreneurship network', 'internpe'], w: ['job', 'work'], a: 'Two remote Python internships in 2026: Back-End / Python Developer Intern at The Entrepreneurship Network (May–Aug, ending with a letter of recommendation from the Director) and Python Programming Intern at InternPe (May–Jun).', more: 'At TEN I built an expense tracker and the Student Attendance Management System. At InternPe I shipped a new object-oriented Python project every week, including Connect Four with an AI opponent and Pong: AI Edition.', go: [L.experience], next: ['What did you build there?', 'Do you have a recommendation letter?'] },

    // ---- availability and contact ----
    { id: 'availability', k: ['available', 'availability', 'open to', 'looking for', 'seeking', 'start', 'joining', 'join', 'remote', 'hybrid', 'onsite', 'on site', 'relocate', 'relocation', 'full time', 'part time', 'freelance', 'opportunity', 'opportunities', 'open to work', 'hiring', 'collaborate', 'collaboration', 'teammate'], a: 'Yes, I’m open to internships: remote, hybrid or in Bhubaneswar. I’m also happy to join hackathon teams and interesting projects.', go: [L.contact, L.linkedin], next: ['How can I contact you?', 'Why should we hire you?'] },
    { id: 'contact', k: ['contact', 'email', 'mail', 'gmail', 'reach', 'connect', 'message', 'get in touch', 'talk to you', 'dm'], a: 'The easiest way is the form right below, or email ' + EMAIL + '. You can also find me on LinkedIn, GitHub and Instagram.', go: [L.contact, L.linkedin, L.github, L.instagram], next: ['Are you available?', 'Can I see your resume?'] },
    { id: 'phone', k: ['phone', 'mobile', 'whatsapp', 'number', 'call you', 'contact number', 'phone number', 'mobile number'], a: 'My number is on my resume PDF, so download it from the section above. Or message me here and I’ll get back to you.', go: [L.resume, L.contact], next: ['Can I see your resume?'] },
    { id: 'socials', k: ['social', 'socials', 'social media', 'profiles', 'handle', 'handles', 'accounts', 'online'], a: 'I’m on LinkedIn for my experience and posts, GitHub (@somyaranjansahoo6422) for my code, and Instagram (@somya_ranjan__22).', go: [L.linkedin, L.github, L.instagram], next: ['What’s on your GitHub?'] },
    { id: 'linkedin', k: ['linkedin', 'linked in'], a: 'Here’s my LinkedIn: it has my experience, full education and hackathon posts. That’s the best place to follow what I’m up to.', go: [L.linkedin], next: ['How can I contact you?'] },
    { id: 'instagram', k: ['instagram', 'insta'], a: 'I’m @somya_ranjan__22 on Instagram.', go: [L.instagram], next: ['What are your hobbies?'] },
    { id: 'github', k: ['github', 'repo', 'repos', 'repository', 'repositories', 'source code', 'open source', 'code'], a: 'My code is on GitHub as @somyaranjansahoo6422: Python projects, games, my internship work and the GOD VIEW back-end.', live: 'count', go: [L.github], next: ['What are you building now?', 'Which projects?'] },
    { id: 'latest', k: ['latest', 'recent', 'recently', 'currently', 'current', 'now building', 'working on', 'building now', 'these days', 'nowadays', 'right now', 'up to'], a: 'Lately I’ve been working on my hackathon projects with ASTRA-X and on my own builds. My GitHub always has the newest work.', live: 'latest', go: [L.github], next: ['Which projects?', 'What’s your team?'] },
    { id: 'resume', k: ['resume', 'cv', 'biodata', 'pdf', 'download'], a: 'Both one-page resumes are in the section above: Developer · ATS for companies, and the placement-cell format with my photo. Pick one and hit Download PDF.', go: [L.resume], next: ['What are your skills?', 'Any internships?'] },

    // ---- skills ----
    { id: 'skills', k: ['skill', 'skills', 'stack', 'tech stack', 'technologies', 'technology', 'tools', 'programming', 'languages you', 'coding', 'expertise', 'framework', 'frameworks', 'proficient', 'libraries'], a: 'Languages: Python, SQL (MySQL), Node.js, C and HTML/CSS. Frameworks: FastAPI, Streamlit, Tkinter, Pygame, Three.js, Vite, Next.js and React. Data and AI: pandas, NumPy, Plotly, OpenCV, FastALPR, TensorFlow Lite and the Gemini API. Tools: Git, Excel, SQLite, Neo4j, Vitest, WebRTC, Raspberry Pi and Vercel.', go: [L.about], next: ['Do you know SQL?', 'Do you work with AI?'] },
    { id: 'ai', k: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'computer vision', 'ml', 'llm', 'generative'], a: 'Yes. I work on applied AI and computer vision: number-plate recognition with FastALPR (YOLOv9 + MobileViT OCR), TensorFlow Lite on a Raspberry Pi for UNSPOKEN, and the Gemini API.', go: [L.work], next: ['Tell me about UNSPOKEN', 'Tell me about the toll system'] },
    { id: 'hardware', k: ['hardware', 'iot', 'embedded', 'robot', 'robotics', 'electronics', 'sensor', 'sensors'], a: 'Yes. UNSPOKEN is a Raspberry Pi wearable with ultrasonic sensors, vibration motors and an IMU, and I competed in Sand Rover at KSHITIJ 2026, IIT Kharagpur. I also attended an Arduino Boot Camp at GITA.', go: [P('unspoken')], next: ['Tell me about UNSPOKEN'] },
    { id: 'languages', k: ['speak', 'spoken', 'english', 'hindi', 'odia', 'oriya', 'mother tongue'], a: 'I speak English, Hindi and Odia.', go: [L.about], next: ['What programming languages do you know?'] },

    // ---- projects ----
    { id: 'projects', k: ['project', 'projects', 'portfolio', 'built', 'build', 'made', 'created', 'developed', 'apps', 'application', 'applications', 'best work', 'best project', 'favourite project', 'favorite project', 'proud'], a: 'My main projects: VANTAGE: ZERO (a voice-controlled 3D flight game), GOD VIEW (an OSINT digital twin, national finalist), UNSPOKEN (an assistive wearable, Best Innovation Team), the Smart Toll Plaza & GIS Command Center, ANUMATI (a regulatory clearance engine) and a Student Attendance Management System.', more: 'I also built VECTOR, an air-traffic-control simulator played by voice, plus team builds at Hacker House Goa, MindEase, and smaller games such as Pong: AI Edition, Connect 4 vs AI and Snake.', go: [L.work], next: ['Tell me about GOD VIEW', 'Tell me about UNSPOKEN', 'What’s the hardest problem you solved?'] },
    { id: 'hardest', k: ['hardest', 'toughest', 'difficult', 'challenge', 'challenging', 'biggest challenge', 'problem you solved', 'failure', 'failed', 'mistake'], a: 'On GOD VIEW, OpenSky rate-limits requests and CelesTrak sometimes returns an HTML error page instead of data, right when you need it most. I added a 15-second cache, fallback data and response checks, so the globe keeps working in the middle of a live demo.', go: [P('godview')], next: ['Tell me about GOD VIEW', 'What’s your work style?'] },
    { id: 'vantage', k: ['vantage', 'vantage zero', 'flight game', 'flight', 'fighter', 'jet', 'game', 'games', 'three js', 'wispr', 'voice game'], a: 'VANTAGE: ZERO is a voice-controlled 3D combat flight game that runs in the browser. You fly a Su-57 or F-35 by voice, keyboard or mouse. I built it solo with TypeScript, Three.js and Vite for the Wispr Flow challenge at Hacker House Goa 2026, and it’s live.', more: 'It has a 120 Hz flight model, four missions, a survival mode, an AI wingman and 81 automated Vitest tests. Terrain, audio and dialogue are generated locally, so it never needs the network.', go: [P('vantage'), { href: 'https://vantage-zero.vercel.app', label: 'Play it', ext: 1 }], next: ['What other projects?', 'Tell me about Hacker House Goa'] },
    { id: 'godview', k: ['god view', 'godview', 'osint', 'digital twin', 'globe', 'satellite', 'satellites', 'cesium', 'opensky'], a: 'GOD VIEW is an open-source-intelligence digital twin: live flights and satellites on a 3D globe, linked in a knowledge graph. It was a team build by ASTRA-X. My part was the back-end ingestion that pulls OpenSky and CelesTrak data with FastAPI. We presented it at the national finals of India Innovates 2026.', more: 'It takes live feeds from OpenSky, CelesTrak and USGS (earthquakes), and Sarvam AI writes summaries in English, Hindi, Tamil and Telugu. The stack: FastAPI, Neo4j, Next.js and CesiumJS. I added a 15-second cache, fallback data and response checks so the globe survives rate limits.', go: [P('godview')], next: ['Tell me about India Innovates', 'What’s the hardest problem you solved?'] },
    { id: 'unspoken', k: ['unspoken', 'wearable', 'assistive', 'blind', 'visually impaired', 'non verbal', 'gesture', 'gestures', 'raspberry', 'raspberry pi'], a: 'UNSPOKEN is a chest-mounted wearable that helps visually impaired users sense obstacles and lets non-verbal users speak through gestures. Team ASTRA-X built it on a Raspberry Pi Zero 2 W with TensorFlow Lite, and it won Best Innovation Team at CHAKRAVYUH 1.0.', more: 'Two ultrasonic sensors and vibration motors give left and right alerts, and an IMU turns lean gestures into spoken phrases. Safety features run offline; richer scene description uses the Gemini API when there’s a connection.', go: [P('unspoken')], next: ['Tell me about CHAKRAVYUH', 'What’s your team?'] },
    { id: 'toll', k: ['toll', 'toll plaza', 'plaza', 'number plate', 'license plate', 'alpr', 'anpr', 'fastag', 'gis', 'streamlit project', 'nhai', 'map'], a: 'The Smart Toll Plaza Management & GIS Command Center is my solo prototype, an upgrade of my Class 12 toll plaza project with my friend Suman Kumar Behera: live number-plate recognition, a Pan-India toll-plaza map and role-based reporting, built with Python, Streamlit, FastALPR and OpenCV. It’s a simulation for learning, not connected to live FASTag or NHAI systems.', more: 'A camera frame goes through YOLOv9 plate detection and MobileViT OCR, an Indian plate-format check and blacklist screening, then lands in a ledger. The map covers 2,000+ plazas. It grew out of my Class XII project.', go: [P('toll')], next: ['Do you work with AI?', 'What other projects?'] },
    { id: 'anumati', k: ['anumati', 'clearance', 'clearances', 'licence', 'license', 'regulatory', 'dag', 'dependency graph'], a: 'ANUMATI is a regulatory-clearance engine by Team ASTRA-X that models business licences as a dependency graph, so applicants see what can be filed in parallel. Built with Next.js, TypeScript, Fastify and PostgreSQL, it was selected in the Smart India Hackathon 2026 college round.', go: [P('anumati')], next: ['Tell me about SIH', 'What other projects?'] },
    { id: 'attendance', k: ['attendance', 'qr', 'qr code', 'tkinter', 'student attendance', 'proxy'], a: 'The Student Attendance Management System is a multi-role desktop app I built during my TEN internship with Python, Tkinter and SQLite. Students check in by scanning a QR code on their phone, and a session token stops proxy attendance. It’s packaged as a Windows release on GitHub.', go: [P('attendance')], next: ['Any internships?', 'What other projects?'] },
    { id: 'vector', k: ['vector', 'air traffic', 'atc'], a: 'VECTOR is a 3D flight game I built by voice dictation with Wispr Flow, using Python, FastAPI and Three.js. It began as an air-traffic-control simulator played with spoken ATC commands, and is now an air-combat prototype where you fly an F-35 or Su-57 across three fictional theatres.', go: [L.work], next: ['Tell me about VANTAGE: ZERO'] },
    { id: 'mindease', k: ['mindease', 'mind ease', 'stress'], a: 'MindEase was my first hackathon project, shortlisted at Smart India Hackathon 2025: a 10-question Stress Analyser that turns your answers into a wellbeing score with suggestions, plus a calming Zen Memory Match game, in plain HTML, CSS and JavaScript.', go: [L.work], next: ['Tell me about SIH'] },
    { id: 'smallbuilds', k: ['pong', 'snake', 'connect 4', 'connect four', 'tic tac toe', 'calculator', 'expense', 'expense tracker', 'pygame'], a: 'Yes, those are among my smaller builds: Pong: AI Edition (Pygame), Connect 4 vs AI, Snake, a calculator and an expense tracker, all in Python and on my GitHub.', go: [L.github], next: ['Which projects?'] },
    { id: 'website', k: ['website', 'this site', 'this website', 'this page', 'hand', 'hands', 'animation', 'animations', 'intro', 'how was this made', 'how is this built', 'design'], a: 'I built this portfolio with plain HTML, CSS and JavaScript, with no framework. The two hands in the intro are real photos of my own hands, cut into parts and rigged in CSS 3D. Each hand looks after its own half of the page.', go: [L.about], next: ['Which projects?', 'What are your skills?'] },

    // ---- hackathons ----
    { id: 'hackathons', k: ['hackathon', 'hackathons', 'hack', 'competition', 'competitions', 'contest', 'win', 'wins', 'won', 'winner', 'winning', 'award', 'awards', 'prize', 'achievement', 'achievements', 'accomplishment', 'accomplishments', 'finalist', 'rank', 'recognition'], a: '8 hackathons since 2025, 7 of them national: Best Innovation Team at CHAKRAVYUH 1.0 (₹10,000 prize), national finalist at India Innovates 2026, and 3 shortlists including Smart India Hackathon.', more: 'I’ve also competed at KSHITIJ 2026 (IIT Kharagpur), Hacker House Goa 2026, ET Gen AI Hackathon (Phase 2), Hack For Green Bharat (Top 400) and Google Gemini’s Fund My Crazy.', go: [L.journey], next: ['Tell me about CHAKRAVYUH', 'Tell me about India Innovates', 'What’s your team?'] },
    { id: 'chakravyuh', k: ['prize money', 'prize amount', 'cash prize', 'chakravyuh', 'chakravyuha', 'best innovation', 'innovation team', '36 hour', '36 hours'], a: 'CHAKRAVYUH 1.0 was a 36-hour National Hackathon at GITA Bhubaneswar in January 2026. Our wearable UNSPOKEN won Best Innovation Team and a ₹10,000 prize.', go: [P('unspoken')], next: ['Tell me about UNSPOKEN'] },
    { id: 'indiainnovates', k: ['india innovates', 'innovates', 'bharat mandapam', 'delhi', 'national final', 'national finals', 'nationals'], a: 'India Innovates 2026 took us to the national finals at Bharat Mandapam, New Delhi, in March 2026, where Team ASTRA-X presented GOD VIEW, representing Odisha and my college.', more: 'We took an overnight train from Bhubaneswar to Delhi, and the Government of Odisha hosted us there. We had to defend our architecture and design in front of technical evaluators and industry leaders.', go: [P('godview')], next: ['Tell me about GOD VIEW'] },
    { id: 'sih', k: ['sih', 'smart india', 'smart india hackathon'], a: 'At Smart India Hackathon 2025, MindEase, my first hackathon project, was shortlisted. At SIH 2026, our project ANUMATI was selected in the college internal round.', go: [L.journey], next: ['Tell me about ANUMATI', 'Tell me about MindEase'] },
    { id: 'hhgoa', k: ['hacker house', 'goa', 'hhgoa', 'solana', 'tigergraph', 'fraud', 'face scan'], a: 'At Hacker House Goa 2026 I built VANTAGE: ZERO solo for the Wispr Flow challenge and joined two team builds: a face-scan verification tool anchored on Solana and a card-fraud console on TigerGraph.', go: [L.journey], next: ['Tell me about VANTAGE: ZERO'] },
    { id: 'kshitij', k: ['kshitij', 'kharagpur', 'iit', 'sand rover', 'rover'], a: 'I took part in KSHITIJ 2026, the techno-management fest of IIT Kharagpur, in the Sand Rover event in January 2026.', go: [L.journey], next: ['Do you work with hardware?'] },
    { id: 'otherhack', k: ['green bharat', 'et gen ai', 'gen ai', 'fund my crazy', 'gemini', 'uidai', 'unstop', 'campuscrew'], a: 'Other rounds I’ve competed in: Hack For Green Bharat (Top 400), ET Gen AI Hackathon (Phase 2), Google Gemini’s Fund My Crazy ideation night and the UIDAI Data Hackathon.', go: [L.journey], next: ['Hackathon wins?'] },
    { id: 'team', k: ['team', 'teammate', 'teammates', 'astra', 'astra x', 'astrax', 'swagat', 'shubham', 'members', 'friends', 'group'], a: 'ASTRA-X is my hackathon team, started at the beginning of 2026: Swagat Swarup Sahu, Shubham Mohapatra and me. We’ve won Best Innovation Team at CHAKRAVYUH 1.0, reached the national finals of India Innovates 2026 and cleared the SIH 2026 college round.', go: [L.about], next: ['Hackathon wins?', 'Are you open to joining a team?'] },

    // ---- certificates ----
    { id: 'certificates', k: ['certificate', 'certificates', 'certification', 'certifications', 'certified', 'course', 'courses', 'coursera', 'credential', 'credentials', 'badge', 'badges', 'verify', 'verified'], a: '30 certificates and 12 awards and badges, 13 of them verifiable on Coursera. The highlights: Google Data Analysis with Python (6 courses), Duke University’s Programming Fundamentals, and Junior Software Developer, NSQF Level 3.', more: 'There’s also Introduction to Microsoft Excel, Digital Productivity with AI (UNICEF YuWaah, 100%), Critical Thinking & Logic, Emotional Intelligence and Handling Difficult Conversations.', go: [L.credentials], next: ['Tell me about NCC', 'What are your skills?'] },
    { id: 'googlecert', k: ['google', 'google data', 'specialization', 'data analysis with python'], a: 'Google Data Analysis with Python is a six-course specialization developed by Google on Coursera, which I completed in June 2026. It covers Python, NumPy, pandas and Jupyter Notebooks, and you can verify it on Coursera.', go: [L.credentials], next: ['Do you work with AI?'] },

    // ---- things I keep private: never an error, always a friendly route ----
    { id: 'private-age', k: ['age', 'old', 'how old', 'birthday', 'dob', 'date of birth', 'born', 'birth'], a: 'I keep that one private, but here’s what matters: I’m in the ' + YEAR + ' year of my B.Tech, graduating in 2029.', go: [L.contact], next: ['Where do you study?'] },
    { id: 'private-grades', k: ['cgpa', 'gpa', 'sgpa', 'marks', 'percentage', 'grade', 'grades', 'score', 'scores', 'result', 'results', 'topper'], a: 'I don’t list college grades here since I’m still in my ' + YEAR + ' year. Class X and XII were both 1st Division. Message me if you need more for an application.', go: [L.contact], next: ['Where do you study?', 'Hackathon wins?'] },
    { id: 'private-money', k: ['salary', 'stipend', 'ctc', 'package', 'pay', 'expected salary', 'expectation', 'expectations', 'money', 'rate', 'charge', 'fees'], a: 'I’m happy to talk about that directly, since it depends on the role. Send me a message with the details.', go: [L.contact], next: ['Are you available?'] },
    { id: 'private-personal', k: ['girlfriend', 'boyfriend', 'wife', 'married', 'marriage', 'single', 'relationship', 'crush', 'dating', 'father', 'mother', 'parents', 'family', 'brother', 'sister', 'siblings', 'religion', 'caste', 'politics', 'address', 'house', 'income', 'height', 'weight'], a: 'That’s personal, so I keep it off this site. I’m happy to talk about my work, projects and skills, though.', go: [L.about], next: ['What are your hobbies?', 'Which projects?'] },
    { id: 'private-6422', k: ['6422', 'meaning of 6422', 'why 6422'], a: 'That one stays my little secret. It’s just a number I’ve carried with me.', go: [L.about], next: ['Who are you?'] }
  ];

  // Tech I can speak to, and where it shows up. Used for "do you know X" answers.
  var TECH = {
    python: 'Python is my main language. I’ve been learning it since Class XI, and since then I’ve done two Python internships, the Google Data Analysis with Python specialization, and most of my projects.',
    sql: 'Yes. I’ve been learning SQL with MySQL since Class XI and I’m still polishing it, because it matters for my goal of becoming a data analyst. I’ve also used SQLite in my attendance app, and PostgreSQL was part of ANUMATI.',
    sqlite: 'Yes. SQLite powers my Student Attendance Management System.',
    postgresql: 'Yes, as part of the team build on ANUMATI, whose server runs on Fastify and PostgreSQL.',
    neo4j: 'Yes. GOD VIEW uses a Neo4j graph of entities and relationships.',
    node: 'I picked up Node.js hands-on, through hackathons and projects: UNSPOKEN, for example, runs a Node.js WebSocket server that feeds a live React dashboard. I’m still building on it, and Python is my main language.',
    javascript: 'Yes. I’ve known the basics of JavaScript since school, and I’ve used it and TypeScript on the web, including this site and VANTAGE: ZERO.',
    typescript: 'Yes. VANTAGE: ZERO is written in TypeScript, and ANUMATI uses it too.',
    react: 'Yes. UNSPOKEN has a live React dashboard, and ANUMATI uses Next.js with React Flow.',
    next: 'Yes. GOD VIEW and ANUMATI both have Next.js front ends.',
    three: 'Yes. VANTAGE: ZERO and VECTOR both use Three.js.',
    vite: 'Yes. VANTAGE: ZERO is built with Vite.',
    html: 'Yes. I’ve known the basics of HTML and CSS since Computer Science became my additional subject in Class VI, and this site is built with them.',
    css: 'Yes. I’ve known the basics of HTML and CSS since Computer Science became my additional subject in Class VI, and this site is built with them.',
    c: 'I know the basics of C. I learned it to be a good all-rounder, and Python is what I use day to day.',
    java: 'I learned Java from the basics up to OOP and practised it, mainly to be a good all-rounder. I’m not using it right now; Python is my main language.',
    fastapi: 'Yes. I used FastAPI for the GOD VIEW back-end and for VECTOR.',
    streamlit: 'Yes. My Smart Toll Plaza system is a multipage Streamlit app.',
    tkinter: 'Yes. My Student Attendance Management System is built on Tkinter.',
    pygame: 'Yes. Pong: AI Edition is built with Pygame.',
    opencv: 'Yes. I use OpenCV in my toll system and UNSPOKEN.',
    pandas: 'Yes. I used pandas to clean the 2,000+ row toll-plaza registry, and I hold the Google Data Analysis with Python specialization.',
    numpy: 'Yes. NumPy is part of my Google Data Analysis with Python specialization.',
    plotly: 'Yes. The toll system’s map and analytics use Plotly.',
    tensorflow: 'Yes. UNSPOKEN runs TensorFlow Lite models on a Raspberry Pi.',
    excel: 'Yes. Excel is in my main stack, I hold Coursera’s Introduction to Microsoft Excel certificate, and my Data lab has an Excel dashboard of India’s toll network.',
    git: 'Yes. Git and GitHub are part of my daily workflow, and I covered them in my TEN internship.',
    vercel: 'Yes. My projects deploy on Vercel.',
    arduino: 'I’ve attended an Arduino Boot Camp at GITA Autonomous College, and my main hardware projects run on Raspberry Pi.',
    webrtc: 'Yes. My toll system reads a WebRTC camera stream.'
  };
  var TECH_ALIAS = { sequel: 'sql', database: 'sql', databases: 'sql', db: 'sql', dbms: 'sql', nodejs: 'node', 'node.js': 'node', js: 'javascript', ts: 'typescript', reactjs: 'react', nextjs: 'next', 'next.js': 'next', threejs: 'three', 'three.js': 'three', postgres: 'postgresql', mysql: 'sql', py: 'python', python3: 'python', tflite: 'tensorflow', github: 'git', 'ms excel': 'excel', spreadsheet: 'excel', spreadsheets: 'excel' };
  // Tech that isn't on my resume: an honest answer, never a guess.
  var NOT_LISTED = ['kotlin', 'swift', 'flutter', 'dart', 'rust', 'golang', 'ruby', 'rails', 'php', 'laravel', 'django', 'flask', 'angular', 'vue', 'svelte', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'tableau', 'powerbi', 'matlab', 'unity', 'unreal', 'blockchain', 'dsa', 'leetcode', 'cplusplus', 'csharp', 'dotnet', 'pytorch', 'scala', 'android', 'ios', 'firebase', 'graphql', 'wordpress', 'figma', 'photoshop'];
  var PRETTY = { golang: 'Go', cplusplus: 'C++', csharp: 'C#', dotnet: '.NET', aws: 'AWS', gcp: 'GCP', dsa: 'DSA', ios: 'iOS', powerbi: 'Power BI', graphql: 'GraphQL', mongodb: 'MongoDB', pytorch: 'PyTorch', php: 'PHP' };

  // Chat shorthand and common slips, fixed before anything else.
  var SHORT = { gole: 'goal', gaol: 'goal', feild: 'field', u: 'you', ur: 'your', urs: 'your', r: 'are', y: 'why', n: 'and', wat: 'what', wht: 'what', wot: 'what', whats: 'what', wut: 'what', hw: 'how', wher: 'where', whr: 'where', wen: 'when', abt: 'about', abut: 'about', bcz: 'because', coz: 'because', cuz: 'because', pls: 'please', plz: 'please', thx: 'thanks', thnx: 'thanks', thanx: 'thanks', ty: 'thanks', tq: 'thanks', hlo: 'hello', helo: 'hello', hii: 'hi', hiii: 'hi', heyy: 'hey', clg: 'college', colg: 'college', exp: 'experience', proj: 'project', projs: 'projects', cert: 'certificate', certs: 'certificates', quals: 'qualification', yrs: 'years', yr: 'year', ph: 'phone', mob: 'mobile', ig: 'instagram', gh: 'github', gf: 'girlfriend', bf: 'boyfriend', hobbys: 'hobbies', im: 'i', ive: 'i', dont: 'do', doesnt: 'does', cant: 'can', wanna: 'want', gonna: 'going', tell: 'tell', btw: 'by', naam: 'name', kaun: 'who', kaha: 'where', kahan: 'where', kya: 'what', padhai: 'study', kaam: 'work', batao: 'tell', kaise: 'how', aap: 'you', tum: 'you', tumhara: 'your', aapka: 'your', hai: 'is', ho: 'are' };
  var STOP = ' a an the is are am was were be been being do does did can could would should will shall may might must have has had i me my mine myself we us our you your yours he him his she her it its they them their this that these those of in on at to for from with by as if then so but or and not no yes any some all very really just also too there here tell say said show give please want need like get got let lets about what which who whom whose when where why how much many ';
  // Everyday words that are left alone, so they never get "corrected" into something else.
  var COMMON = ' system prompt prompts instructions instruction ignore previous print good great nice bad best better well thing things time day today year years month people person world life love food eat movie film song book color colour weather capital president prime minister cricket football favourite favorite think thought feel know knew see look looking use used using work working make making take going come came first last next new old big small long short high low true false right left okay ok sure yes yeah yep nope maybe hello hi hey thanks thank bye goodbye sorry please help question questions answer answers ask asking one two three four five six seven eight nine ten more most less details detail explain elaborate again else other another something anything everything nothing someone anyone joke funny stupid dumb idiot bot robot real human chatgpt main life line pizza burger biryani tea coffee dog cat car bike phone play plays playing read reading watch watching sleep pay paid speak france india ';

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  // Damerau-Levenshtein with an early exit
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var low = i;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }

  // vocabulary: every keyword, tech name and stop word
  var VOCAB = {};
  function addVocab(s) { s.split(' ').forEach(function (w) { if (w.length > 1) VOCAB[w] = 1; }); }
  T.forEach(function (t) { t.k.forEach(addVocab); (t.w || []).forEach(addVocab); });
  Object.keys(TECH).forEach(addVocab); Object.keys(TECH_ALIAS).forEach(addVocab); NOT_LISTED.forEach(addVocab);
  STOP.trim().split(' ').forEach(addVocab);
  ['more', 'hello', 'thanks', 'help'].forEach(addVocab);
  var VOCAB_LIST = Object.keys(VOCAB).filter(function (w) { return !/[.\d]/.test(w); });

  function fix(w) {
    if (VOCAB[w] || VOCAB[stem(w)] || COMMON.indexOf(' ' + w + ' ') > -1 || /\d/.test(w) || w.length < 3) return w;
    var max = w.length <= 5 ? 1 : w.length <= 8 ? 2 : 3, best = null, bestD = 99, bestS = -1;
    for (var i = 0; i < VOCAB_LIST.length; i++) {
      var v = VOCAB_LIST[i];
      if (v.length < 3) continue;
      var d = dist(w, v, max);
      if (d > max) continue;
      if (w.length === 3 && w[0] !== v[0]) continue;
      var s = (w[0] === v[0] ? 2 : 0) + (STOP.indexOf(' ' + v + ' ') > -1 ? 0 : 1) - Math.abs(w.length - v.length) * 0.25;
      if (d < bestD || (d === bestD && s > bestS)) { best = v; bestD = d; bestS = s; }
    }
    return best || w;
  }

  function normalise(q) {
    var s = (' ' + String(q).toLowerCase() + ' ')
      .replace(/[’`]/g, "'").replace(/c\+\+/g, ' cplusplus ').replace(/c#/g, ' csharp ').replace(/\.net\b/g, ' dotnet ')
      .replace(/node\.js/g, ' nodejs ').replace(/next\.js/g, ' nextjs ').replace(/three\.js/g, ' threejs ').replace(/b\.\s?tech/g, ' btech ')
      .replace(/power\s?bi/g, ' powerbi ').replace(/\bgo\s?lang\b/g, ' golang ').replace(/\bmachine\s?learning\b/g, ' machine learning ')
      .replace(/'(s|re|ve|m|ll|d|t)\b/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/(.)\1{2,}/g, '$1$1').replace(/\s+/g, ' ').trim();
    var raw = s ? s.split(' ') : [], changed = false;
    var toks = raw.map(function (w) {
      var m = Object.prototype.hasOwnProperty.call(SHORT, w) ? SHORT[w] : w;
      var f = fix(m);
      if (f !== m) changed = true;
      return f;
    });
    return { toks: toks, text: ' ' + toks.join(' ') + ' ', changed: changed };
  }

  var GENERAL = { identity: 1, projects: 1, internships: 1, certificates: 1, school: 1, hackathons: 1, skills: 1 };
  function score(t, n) {
    var sc = 0, hits = 0, content = n.toks.filter(function (w) { return STOP.indexOf(' ' + w + ' ') < 0; }).map(stem);
    var seen = {};
    t.k.forEach(function (key) {
      if (key.indexOf(' ') > -1) { if (n.text.indexOf(' ' + key + ' ') > -1) { sc += 4; hits++; } return; }
      var st = stem(key);
      if (!seen[st] && content.indexOf(st) > -1) { seen[st] = 1; sc += 3; hits++; }
    });
    (t.w || []).forEach(function (key) { if (content.indexOf(stem(key)) > -1) sc += 1; });
    if (GENERAL[t.id] && sc) sc -= 0.5;
    return { sc: sc, hits: hits };
  }
  function has(n, re) { return re.test(n.text); }

  function pack(t, text) {
    return { topic: t.id, text: text || t.a, links: t.go || [], next: t.next || [], live: t.live, hasMore: !!t.more };
  }
  function byId(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i]; return null; }

  var FALLBACKS = [
    'I don’t have that one yet, but I’d be glad to answer it myself. Message me, or have a look through this site, my resume and my profiles.',
    'That’s not something I can answer here. The best way is to ask me directly, or you can explore my resume, projects and social profiles.',
    'Good question, and one I’d rather answer in person. Reach out to me here or on LinkedIn, or look through my resume and this site.'
  ];
  var fallbackN = 0;
  function fallback(near) {
    var f = FALLBACKS[fallbackN++ % FALLBACKS.length];
    return { topic: 'unknown', text: f, links: [L.contact, L.resume, L.linkedin, L.github, L.instagram], next: near && near.length ? near : ['Who are you?', 'Which projects?', 'What are your skills?'] };
  }

  function techAnswer(n) {
    var found = [], missing = [], seen = {};
    n.toks.forEach(function (w, i) {
      var two = n.toks[i + 1] ? w + ' ' + n.toks[i + 1] : '';
      var key = TECH_ALIAS[two] || TECH_ALIAS[w] || w;
      if (key === 'c' && !/ (know|learn|use|in|of|and|language) c | c (languages?|programming) /.test(n.text)) return;
      if (key === 'next' && !has(n, / next (js|framework)|nextjs /)) return;
      if (key === 'three' && !has(n, / three js|threejs /)) return;
      if (key === 'git' && w === 'github') return;
      if (TECH[key] && !seen[key]) { seen[key] = 1; found.push(TECH[key]); }
      else if (NOT_LISTED.indexOf(w) > -1 && !seen[w]) { seen[w] = 1; missing.push(PRETTY[w] || w.charAt(0).toUpperCase() + w.slice(1)); }
    });
    if (!found.length && !missing.length) return null;
    var text = found.slice(0, 3).join(' ');
    if (missing.length) text += (text ? ' ' : '') + missing.join(' and ') + (missing.length > 1 ? ' aren’t' : ' isn’t') + ' on my resume yet. My main stack is Python, Node.js and SQL, and I’m happy to talk about what your project needs.';
    return { topic: 'tech', text: text, links: missing.length ? [L.contact, L.resume] : [L.work], next: ['What are your skills?', 'Which projects?'] };
  }

  // state: { last: topic id } carries the conversation
  function reply(q, state) {
    state = state || {};
    var n = normalise(q), toks = n.toks, words = toks.filter(function (w) { return STOP.indexOf(' ' + w + ' ') < 0; });
    function done(r) { state.last = r.topic === 'unknown' || r.topic === 'small' ? state.last : r.topic; r.read = n.changed && r.topic !== 'unknown' ? toks.join(' ') : null; return r; }
    if (!toks.length) return done(fallback());

    // small talk
    if (has(n, / (fuck|shit|bitch|bastard|asshole|idiot|stupid|dumb|useless|chutiya|madarchod|bhenchod) /)) return done({ topic: 'small', text: 'I’ll stick to work questions. Ask me about my projects, skills or experience, or message me directly.', links: [L.contact], next: ['Which projects?', 'What are your skills?'] });
    if (has(n, / (are you|you are|is this|you) (a |an )?(bot|robot|ai|chatbot|real|human|chatgpt)/) || has(n, / (who|what) (made|built|created) (you|this chat)/) || has(n, / how (do|does) (you|this chat) work /)) return done({ topic: 'small', text: 'I’m a small assistant built into Sonu’s portfolio, and I answer in his voice. Everything I say comes from his resume, this site and his public profiles, and your questions never leave this page. For anything deeper, message him directly.', links: [L.contact, L.linkedin], next: ['Who are you?', 'Which projects?'] });
    if (has(n, / how are you | how you doing | how is it going | what up | wassup | sup /)) return done({ topic: 'small', text: 'Doing well, thanks for asking! Probably building something. What would you like to know about me?', links: [], next: ['Who are you?', 'Which projects?', 'Are you available?'] });
    if (words.length <= 2 && has(n, / (hi|hello|hey|hola|namaste|namaskar|greetings|yo) /) || has(n, / good (morning|afternoon|evening) /)) return done({ topic: 'small', text: 'Hi! I’m Sonu. Ask me anything about my work, skills, projects or experience.', links: [], next: ['Who are you?', 'What are your skills?', 'Any internships?'] });
    if (words.length && words.every(function (w) { return /^(thanks|thank|great|nice|awesome|cool|good|impressive|wow|amazing|perfect|okay|ok|much|lot|job|work|site|portfolio|website)$/.test(w); }) && words.length <= 3 && !has(n, / (is|are|do|does|how|what|which|where|why) /)) return done({ topic: 'small', text: 'Thanks! If you’d like to work together, I’m one message away.', links: [L.contact, L.linkedin], next: ['Are you available?', 'Can I see your resume?'] });
    if (has(n, / (bye|goodbye|see you|take care) /)) return done({ topic: 'small', text: 'Thanks for stopping by! You can always reach me through the contact form.', links: [L.contact], next: [] });
    if (has(n, / (help|what can you|what should i ask|what can i ask|what do you know) /)) return done({ topic: 'small', text: 'Ask me about my projects, skills, internships, hackathons, certificates, education or availability, in your own words. Spelling doesn’t matter.', links: [], next: ['Which projects?', 'Hackathon wins?', 'Where do you study?'] });

    // follow-ups: "tell me more", "why?", "how?" on the last topic
    var isMore = has(n, / (more|elaborate|explain|details|detail|continue|go on|expand) /) && words.length <= 3 || (toks.length <= 2 && has(n, / (why|how|then|and|really) /));
    if (isMore && state.last) {
      var lt = byId(state.last);
      if (lt && lt.more && state.moreOf !== lt.id) { state.moreOf = lt.id; return done({ topic: lt.id, text: lt.more, links: lt.go || [], next: lt.next || [] }); }
      if (lt) return done({ topic: lt.id, text: 'That’s the short version. There’s more on the site, or ask me directly.', links: (lt.go || []).concat([L.contact]), next: lt.next || [] });
    }
    // "what did you build there": points back to the last topic
    if (state.last === 'internships' && has(n, / (build|built|made|do|did) (there|at) /)) return done(pack(byId('internships'), byId('internships').more));

    // "do you know X" and any tech named directly
    var techIntent = has(n, / c (languages?|programming) /) || has(n, / (know|learn|learned|use|used|using|experience|work with|worked with|familiar|good|code|coding|skill|skills|proficient|expert|have) /) || words.length <= 2;
    var tech = techIntent ? techAnswer(n) : null;

    // score the topics
    var ranked = T.map(function (t) { var s = score(t, n); return { t: t, sc: s.sc, hits: s.hits }; })
      .filter(function (r) { return r.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; });
    var top = ranked[0];
    if (tech && (!top || top.sc <= 4 || /^(skills|ai|internships|github|role)$/.test(top.t.id))) return done(tech);
    if (top && (top.hits > 0 || top.sc >= 2)) {
      var r = pack(top.t);
      // two clear topics in one question: answer both
      var second = ranked[1];
      if (second && second.hits > 0 && second.sc >= top.sc && has(n, / and /) && second.t.id !== top.t.id) { r.text += ' ' + second.t.a; r.links = r.links.concat(second.t.go || []).slice(0, 4); }
      return done(r);
    }
    if (tech) return done(tech);

    // no keyword at all: the question word alone often says enough
    if (!words.length) {
      if (has(n, / who /)) return done(pack(byId('identity')));
      if (has(n, / where /)) return done(pack(byId('location')));
      if (has(n, / what /) && has(n, / you /)) return done(pack(byId('role')));
      if (has(n, / why /)) return done(pack(byId('whyhire')));
      if (has(n, / when /)) return done(pack(byId('availability')));
    }
    return done(fallback());
  }

  // ---- the chat itself ----
  function live(kind) {
    if (!window.__ghRepos) return Promise.resolve(null);
    return window.__ghRepos().then(function (list) {
      if (!list || !list.length) return null;
      var own = list.filter(function (x) { return !x.fork; });
      if (kind === 'count') return 'Right now there are ' + own.length + ' public repositories there.';
      var r = own[0], when = r.pushed ? new Date(r.pushed).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
      return 'My latest GitHub activity is on ' + r.name.replace(/[-_]+/g, ' ') + (when ? ' (' + when + ')' : '') + '.';
    }).catch(function () { return null; });
  }

  function init() {
    var form = document.getElementById('askForm'), input = document.getElementById('askIn'), log = document.getElementById('askLog'), chips = document.getElementById('askChips'), clear = document.getElementById('askClear');
    if (!form || form._ready) return;
    form._ready = true;
    var state = {}, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var starter = Array.prototype.map.call(chips.children, function (c) { return c.textContent; });

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function toEnd() { log.scrollTop = log.scrollHeight; }
    function setChips(list) {
      chips.textContent = '';
      list.slice(0, 4).forEach(function (t) { var b = el('button', 'ask__chip', t); b.type = 'button'; b.addEventListener('click', function () { ask(t); }); chips.appendChild(b); });
    }
    function say(r) {
      var m = el('div', 'ask__msg ask__msg--me');
      if (r.read) m.appendChild(el('p', 'ask__read', 'Read as: “' + r.read + '”'));
      var p = el('p', 'ask__text', r.text); m.appendChild(p);
      if (r.links && r.links.length) {
        var row = el('p', 'ask__links');
        r.links.forEach(function (l) {
          var a = el('a', 'ask__link', l.label + (l.ext ? ' ↗' : ' →')); a.href = l.href;
          if (l.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          row.appendChild(a);
        });
        m.appendChild(row);
      }
      log.appendChild(m);
      if (r.live) live(r.live).then(function (extra) { if (extra) { p.textContent += ' ' + extra; toEnd(); } });
      setChips(r.next && r.next.length ? r.next : starter);
      toEnd();
    }
    function ask(q) {
      q = q.trim(); if (!q) return;
      log.hidden = false; clear.hidden = false;
      log.appendChild(el('div', 'ask__msg ask__msg--you', q));
      input.value = '';
      var r = reply(q, state);
      if (window.__sfx) window.__sfx('tick');
      if (reduce) return say(r);
      var dots = el('div', 'ask__msg ask__msg--me ask__typing'); dots.setAttribute('aria-hidden', 'true');
      dots.appendChild(el('i')); dots.appendChild(el('i')); dots.appendChild(el('i'));
      log.appendChild(dots); toEnd();
      setTimeout(function () { dots.remove(); say(r); }, 320 + Math.min(420, r.text.length * 2));
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    Array.prototype.forEach.call(chips.children, function (c) { c.addEventListener('click', function () { ask(c.textContent); }); });
    clear.addEventListener('click', function () { log.textContent = ''; log.hidden = true; clear.hidden = true; state = {}; setChips(starter); input.focus(); });
    if (form._pending) { ask(form._pending); form._pending = ''; }
  }

  window.AskMe = { reply: reply, init: init, normalise: normalise };
  if (typeof document !== 'undefined' && document.getElementById) init();
})();
