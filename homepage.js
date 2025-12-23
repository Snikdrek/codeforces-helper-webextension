// Load and display missions with detailed information
function loadMissions() {
  chrome.storage.local.get(['missions', 'missionsDate', 'userHandle', 'settings'], (result) => {
    const missions = result.missions || [];
    const missionsDate = result.missionsDate || 'Unknown';
    const userHandle = result.userHandle || null;
    const settings = result.settings || { maxProblems: 5, minRating: 900, maxRating: 1200 };
    
    const missionCountDisplay = document.getElementById('missionCountDisplay');
    missionCountDisplay.textContent = `${missions.length} Problem(s) - ${missionsDate}`;
    
    // Load user handle in input
    if (userHandle) {
      document.getElementById('userHandle').value = userHandle;
    }
    
    // Load settings
    document.getElementById('maxProblems').value = settings.maxProblems || 5;
    document.getElementById('minRating').value = settings.minRating || 900;
    document.getElementById('maxRating').value = settings.maxRating || 1200;
    
    displayMissionsGrid(missions, userHandle);
  });
}

// Fetch user's solved problems
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

// Display missions in grid format
function displayMissionsGrid(missions, userHandle) {
  const missionsGrid = document.getElementById('missionsGrid');
  
  if (!missions || missions.length === 0) {
    missionsGrid.innerHTML = '<div class="loading">No missions available yet. Refresh to generate new ones.</div>';
    return;
  }
  
  // If user handle is set, fetch their solved problems
  if (userHandle) {
    getUserSolvedProblems(userHandle).then(solvedProblems => {
      renderMissions(missions, solvedProblems, missionsGrid);
    });
  } else {
    renderMissions(missions, new Set(), missionsGrid);
  }
}

// Helper function to render missions
function renderMissions(missions, solvedProblems, missionsGrid) {
  missionsGrid.innerHTML = missions.map((mission, index) => {
    const problemId = `${mission.contestId}${mission.index}`;
    const isSolved = solvedProblems.has(problemId);
    const solvedBadge = isSolved ? '<span class="solved-badge">✓ SOLVED</span>' : '';
    
    return `
      <div class="mission-card" data-contest-id="${mission.contestId}" data-index="${mission.index}">
        <div class="problem-header">
          <div class="problem-id">#${index + 1}${solvedBadge}</div>
          <span class="problem-rating">⭐ ${mission.rating}</span>
        </div>
        <div class="problem-name">${mission.name}</div>
        <div style="font-size: 11px; color: #999; margin-top: 8px;">
          Problem: ${mission.contestId}${mission.index}
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  document.querySelectorAll('.mission-card').forEach(card => {
    card.addEventListener('click', () => {
      const contestId = card.getAttribute('data-contest-id');
      const index = card.getAttribute('data-index');
      const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
      chrome.tabs.create({ url: url });
    });
  });
}

// Button handlers
document.getElementById('openCFBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://codeforces.com' });
});

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
    loadMissions();
  });
});

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const maxProblems = parseInt(document.getElementById('maxProblems').value);
  const minRating = parseInt(document.getElementById('minRating').value);
  const maxRating = parseInt(document.getElementById('maxRating').value);
  
  // Validate settings
  if (maxProblems < 1 || maxProblems > 10) {
    alert('Max problems must be between 1 and 10');
    return;
  }
  
  if (minRating >= maxRating) {
    alert('Min rating must be less than max rating');
    return;
  }
  
  // Save settings
  const settings = {
    maxProblems: maxProblems,
    minRating: minRating,
    maxRating: maxRating
  };
  
  chrome.storage.local.set({ settings: settings }, () => {
    alert('Settings saved successfully!');
  });
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  const missionsGrid = document.getElementById('missionsGrid');
  missionsGrid.innerHTML = '<div class="loading">Generating new missions...</div>';
  
  // Get current settings
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || { maxProblems: 5, minRating: 900, maxRating: 1200 };
    generateMissionsWithSettings(settings, missionsGrid);
  });
});

// Generate missions with custom settings
async function generateMissionsWithSettings(settings, missionsGrid) {
  try {
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await response.json();
    
    if (data.status === 'OK') {
      const problems = data.result.problems;
      const missions = [];
      const numMissions = settings.maxProblems;
      const minRating = settings.minRating;
      const maxRating = settings.maxRating;
      const usedIndices = new Set();
      
      while (missions.length < numMissions) {
        const randomIndex = Math.floor(Math.random() * problems.length);
        if (!usedIndices.has(randomIndex)) {
          const problem = problems[randomIndex];
          const rating = problem.rating || 0;
          // Only add problems within rating range
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
      
      chrome.storage.local.set({
        missions: missions,
        missionsDate: new Date().toDateString()
      });
      
      displayMissionsGrid(missions);
    }
  } catch (error) {
    console.error('Error fetching problems:', error);
    missionsGrid.innerHTML = '<div class="loading">Error generating missions. Please try again.</div>';
  }
}
