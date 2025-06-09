import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const calculateBasicCompatibility = (user, peer) => {
  let score = 0;
  let maxScore = 0;

  maxScore += 40;
  if (user.subject_proficient === peer.subject_help && user.subject_help === peer.subject_proficient) {
    score += 40; 
  }

  maxScore += 25;
  if (user.study_schedule === peer.study_schedule) {
    score += 25;
  } else {

    const scheduleCompatibility = getScheduleCompatibility(user.study_schedule, peer.study_schedule);
    score += scheduleCompatibility * 25;
  }

  maxScore += 15;
  if (user.study_duration === peer.study_duration) {
    score += 15;
  } else {
    const durationCompatibility = getDurationCompatibility(user.study_duration, peer.study_duration);
    score += durationCompatibility * 15;
  }

  maxScore += 10;
  if (user.learning_pace === peer.learning_pace) {
    score += 10;
  } else {
    const paceCompatibility = getPaceCompatibility(user.learning_pace, peer.learning_pace);
    score += paceCompatibility * 10;
  }

  maxScore += 10;
  if (user.communication_style === peer.communication_style) {
    score += 10;
  } else {
    const commCompatibility = getCommunicationCompatibility(user.communication_style, peer.communication_style);
    score += commCompatibility * 10;
  }

  return Math.round((score / maxScore) * 100);
};

const getScheduleCompatibility = (schedule1, schedule2) => {
  const scheduleOrder = [
    "Early Morning (6-9 AM)",
    "Morning (9-12 PM)", 
    "Afternoon (12-5 PM)",
    "Evening (5-8 PM)",
    "Night (8-11 PM)",
    "Late Night (11+ PM)"
  ];
  
  const index1 = scheduleOrder.indexOf(schedule1);
  const index2 = scheduleOrder.indexOf(schedule2);
  const difference = Math.abs(index1 - index2);
  
  if (difference <= 1) return 0.7; 
  if (difference <= 2) return 0.4; 
  return 0.1; 
};

const getDurationCompatibility = (duration1, duration2) => {
  const durationOrder = ["30 minutes", "1 hour", "2 hours", "3+ hours"];
  const index1 = durationOrder.indexOf(duration1);
  const index2 = durationOrder.indexOf(duration2);
  const difference = Math.abs(index1 - index2);
  
  if (difference === 0) return 1.0;
  if (difference === 1) return 0.7;
  return 0.3;
};

const getPaceCompatibility = (pace1, pace2) => {
  const paceOrder = ["Fast learner", "Moderate pace", "Take time to understand", "Depends on the subject"];
  const index1 = paceOrder.indexOf(pace1);
  const index2 = paceOrder.indexOf(pace2);
  
  if (pace1 === pace2) return 1.0;
  if (pace1 === "Depends on the subject" || pace2 === "Depends on the subject") return 0.8;
  if (Math.abs(index1 - index2) === 1) return 0.6;
  return 0.3;
};

const getCommunicationCompatibility = (comm1, comm2) => {
  const compatibilityMap = {
    "Direct & Straightforward": ["Direct & Straightforward", "Formal & Professional"],
    "Friendly & Casual": ["Friendly & Casual", "Encouraging & Supportive"],
    "Formal & Professional": ["Formal & Professional", "Direct & Straightforward"],
    "Encouraging & Supportive": ["Encouraging & Supportive", "Friendly & Casual"]
  };
  
  if (comm1 === comm2) return 1.0;
  if (compatibilityMap[comm1]?.includes(comm2)) return 0.7;
  return 0.4;
};

const calculateAvailabilityOverlap = (availability1, availability2) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let overlap = 0;
  let totalDays = 0;
  
  days.forEach(day => {
    if (availability1[day] !== undefined && availability2[day] !== undefined) {
      totalDays++;
      if (availability1[day] && availability2[day]) {
        overlap++;
      }
    }
  });
  
  return totalDays > 0 ? (overlap / totalDays) * 100 : 0;
};

export const findCompatiblePeers = async (currentUser, allPeers) => {
  try {
    const eligiblePeers = allPeers.filter(peer => 
      peer.subject_proficient === currentUser.subject_help && 
      peer.subject_help === currentUser.subject_proficient
    );

    if (eligiblePeers.length === 0) {
      return [];
    }

    const peersWithScores = eligiblePeers.map(peer => {
      const basicScore = calculateBasicCompatibility(currentUser, peer);
      const availabilityScore = calculateAvailabilityOverlap(
        currentUser.availability || {}, 
        peer.availability || {}
      );
      
      return {
        ...peer,
        basicCompatibilityScore: basicScore,
        availabilityScore: availabilityScore,
        overallScore: Math.round((basicScore * 0.7) + (availabilityScore * 0.3))
      };
    });

    const topCandidates = peersWithScores
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10); 

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
You are an expert at matching study partners based on personality and learning compatibility. 

Current User Profile:
- Personality: ${currentUser.personality_type}
- Learning Style: ${currentUser.study_style}
- Communication: ${currentUser.communication_style}
- Study Environment: ${currentUser.study_environment}
- Motivation Level: ${currentUser.motivation_level}
- Goals: ${currentUser.goals || 'Not specified'}
- Study Schedule: ${currentUser.study_schedule}
- Bio: ${currentUser.bio || 'Not provided'}

Analyze these potential study partners and rank the top 5 based on personality compatibility, learning synergy, and overall study partnership potential:

${topCandidates.map((peer, index) => `
Candidate ${index + 1}:
- Name: ${peer.first_name}
- Personality: ${peer.personality_type}
- Learning Style: ${peer.study_style}
- Communication: ${peer.communication_style}
- Study Environment: ${peer.study_environment}
- Motivation Level: ${peer.motivation_level}
- Goals: ${peer.goals || 'Not specified'}
- Study Schedule: ${peer.study_schedule}
- Bio: ${peer.bio || 'Not provided'}
- Basic Compatibility Score: ${peer.basicCompatibilityScore}%
- Schedule Availability Overlap: ${peer.availabilityScore}%
`).join('\n')}

Please provide:
1. Rank the top 5 candidates (1-5, with 1 being the best match)
2. For each top 5 candidate, provide:
   - A compatibility percentage (0-100%)
   - A brief explanation (2-3 sentences) of why they're a good match
   - One potential challenge or area to be aware of
   - A fun compatibility insight

Format your response as JSON:
{
  "matches": [
    {
      "candidateIndex": 0,
      "compatibilityScore": 95,
      "explanation": "You both are highly motivated visual learners who prefer structured study sessions...",
      "challenge": "Your different communication styles might need some adjustment initially...",
      "funInsight": "You both love late-night study sessions and have similar academic goals!"
    }
  ]
}

Only include candidates you genuinely think would be good matches (minimum 60% compatibility). Focus on personality synergy, learning compatibility, and mutual benefit potential.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response:", e);

      return topCandidates.slice(0, 5).map(peer => ({
        ...peer,
        aiCompatibilityScore: peer.overallScore,
        explanation: "Smart match based on study preferences and schedule compatibility.",
        challenge: "Get to know each other's communication styles.",
        funInsight: "You both are working on complementary subjects!"
      }));
    }

    const finalMatches = aiAnalysis.matches.map(match => {
      const peer = topCandidates[match.candidateIndex];
      return {
        ...peer,
        aiCompatibilityScore: match.compatibilityScore,
        explanation: match.explanation,
        challenge: match.challenge,
        funInsight: match.funInsight,
        finalScore: Math.round((peer.overallScore * 0.4) + (match.compatibilityScore * 0.6))
      };
    });

    return finalMatches.sort((a, b) => b.finalScore - a.finalScore);

  } catch (error) {
    console.error("Error in AI matching:", error);
    
    const basicMatches = allPeers
      .filter(peer => 
        peer.subject_proficient === currentUser.subject_help && 
        peer.subject_help === currentUser.subject_proficient
      )
      .map(peer => ({
        ...peer,
        basicCompatibilityScore: calculateBasicCompatibility(currentUser, peer),
        availabilityScore: calculateAvailabilityOverlap(
          currentUser.availability || {}, 
          peer.availability || {}
        ),
        explanation: "Match based on academic subjects and study preferences.",
        challenge: "Get to know each other's learning styles.",
        funInsight: "You have complementary academic strengths!"
      }))
      .sort((a, b) => b.basicCompatibilityScore - a.basicCompatibilityScore)
      .slice(0, 5);

    return basicMatches;
  }
};

export const getMatchInsights = async (user1, user2) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
Analyze the compatibility between these two study partners and provide insights:

Person 1:
- Personality: ${user1.personality_type}
- Learning Style: ${user1.study_style}
- Communication: ${user1.communication_style}
- Study Environment: ${user1.study_environment}

Person 2:
- Personality: ${user2.personality_type}
- Learning Style: ${user2.study_style}
- Communication: ${user2.communication_style}
- Study Environment: ${user2.study_environment}

Provide a brief compatibility analysis (2-3 sentences) focusing on their study partnership potential.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting match insights:", error);
    return "This appears to be a good academic match based on your complementary subjects!";
  }
};