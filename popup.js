// Get random number between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fetch user's solved problems from Codeforces API
async function getUserSolvedProblems(handle) {
  try {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data = await response.json();
    
    if (data.status === 'OK') {
      const solvedProblems = new Set();
      data.result.forEach(submission => {
        if (submission.verdict === 'OK') {
          const problemId = `${submission.problem.contestId}${submission.problem.index}`;
          solvedProblems.add(problemId);
        }
      });
      return solvedProblems;
    }
  } catch (error) {
    console.error('Error fetching user submissions:', error);
  }
  return new Set();
}

// Generate random problems for daily missions
async function generateDailyMissions(settings = {}) {
  try {
    // Use provided settings or defaults
    const maxProblems = settings.maxProblems || 5;
    const minRating = settings.minRating || 900;
    const maxRating = settings.maxRating || 1200;
    
    // Fetch all problems from Codeforces API
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await response.json();
    
    if (data.status === 'OK') {
      const problems = data.result.problems;
      const missions = [];
      const numMissions = maxProblems;
      const usedIndices = new Set();
      
      // Select random unique problems with custom rating range
      while (missions.length < numMissions) {
        const randomIndex = getRandomInt(0, problems.length - 1);
        if (!usedIndices.has(randomIndex)) {
          const problem = problems[randomIndex];
          const rating = problem.rating || 0;
          // Only add problems within custom rating range
          if (rating >= minRating && rating <= maxRating) {
            usedIndices.add(randomIndex);
            missions.push({
            id: problem.contestId + problem.index,
            contestId: problem.contestId,
            index: problem.index,
            name: problem.name,
            rating: problem.rating || 'N/A'
          });
          }
        }
      }
      
      return missions;
    }
  } catch (error) {
    console.error('Error fetching problems:', error);
  }
  return [];
}

// Load or create today's missions
async function loadMissions() {
  const today = new Date().toDateString();
  
  chrome.storage.local.get(['missions', 'missionsDate', 'settings'], async (result) => {
    let missions = result.missions || [];
    const missionsDate = result.missionsDate || null;
    const settings = result.settings || { maxProblems: 5, minRating: 900, maxRating: 1200 };
    
    // If missions don't exist or date has changed, generate new ones
    if (!missions.length || missionsDate !== today) {
      missions = await generateDailyMissions(settings);
      chrome.storage.local.set({
        missions: missions,
        missionsDate: today
      });
    }
    
    displayMissions(missions);
  });
}

// Display missions in the popup
function displayMissions(missions) {
  const missionsList = document.getElementById('missionsList');
  
  if (!missions || missions.length === 0) {
    missionsList.innerHTML = '<div class="loading">No missions available. Please try refreshing.</div>';
    return;
  }
  
  // Get user handle and check solved problems
  chrome.storage.local.get(['userHandle'], async (result) => {
    const userHandle = result.userHandle || null;
    let solvedProblems = new Set();
    
    if (userHandle) {
      solvedProblems = await getUserSolvedProblems(userHandle);
    }
    
    missionsList.innerHTML = missions.map((mission, index) => {
      const problemId = `${mission.contestId}${mission.index}`;
      const isSolved = solvedProblems.has(problemId);
      const solvedBadge = isSolved ? '<span class="solved-badge">✓ SOLVED</span>' : '';
      
      return `
        <div class="mission-item" data-contest-id="${mission.contestId}" data-index="${mission.index}">
          <div class="problem-id">Problem ${index + 1}: ${mission.contestId}${mission.index}${solvedBadge}</div>
          <div class="problem-name">${mission.name}</div>
          <div class="difficulty">Rating: ${mission.rating}</div>
        </div>
      `;
    }).join('');
    
    // Add click handlers to open problems
    document.querySelectorAll('.mission-item').forEach(item => {
      item.addEventListener('click', () => {
        const contestId = item.getAttribute('data-contest-id');
        const index = item.getAttribute('data-index');
        const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
        chrome.tabs.create({ url: url });
      });
    });
  });
}

// Handle button clicks
document.getElementById('openCFBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://codeforces.com' });
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  const missionsList = document.getElementById('missionsList');
  missionsList.innerHTML = '<div class="loading">Generating new missions...</div>';
  
  // Get current settings
  chrome.storage.local.get(['settings'], async (result) => {
    const settings = result.settings || { maxProblems: 5, minRating: 900, maxRating: 1200 };
    const missions = await generateDailyMissions(settings);
    chrome.storage.local.set({
      missions: missions,
      missionsDate: new Date().toDateString()
    });
    
    displayMissions(missions);
  });
});

document.getElementById('homeBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('homepage.html') });
});

// Handle user handle input
document.getElementById('setUserBtn').addEventListener('click', () => {
  const userHandle = document.getElementById('userHandle').value.trim();
  
  if (!userHandle) {
    alert('Please enter a Codeforces handle');
    return;
  }
  
  // Save user handle to storage
  chrome.storage.local.set({ userHandle: userHandle }, () => {
    alert(`Handle set to: ${userHandle}`);
    // Reload missions to show solved status
    chrome.storage.local.get(['missions'], (result) => {
      displayMissions(result.missions || []);
    });
  });
});

// Load user handle on popup open
chrome.storage.local.get(['userHandle'], (result) => {
  if (result.userHandle) {
    document.getElementById('userHandle').value = result.userHandle;
  }
});

// Load missions when popup opens
loadMissions();

