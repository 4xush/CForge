// Mock API endpoint for Codeforces contests
// In a real implementation, this would be a backend endpoint

const mockCodeforcesContests = {
  ongoing: [
    {
      id: 1234,
      name: "Codeforces Round #900 (Div. 2)",
      startTimeSeconds: Math.floor(Date.now() / 1000) - 3600, // Started 1 hour ago
      durationSeconds: 7200, // 2 hours
      phase: "CODING",
    },
  ],
  upcoming: [
    {
      id: 1235,
      name: "Educational Codeforces Round 156 (Rated for Div. 2)",
      startTimeSeconds: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      durationSeconds: 7200, // 2 hours
      phase: "BEFORE",
    },
    {
      id: 1236,
      name: "Codeforces Round #901 (Div. 1 + Div. 2)",
      startTimeSeconds: Math.floor(Date.now() / 1000) + 172800, // Day after tomorrow
      durationSeconds: 9000, // 2.5 hours
      phase: "BEFORE",
    },
    {
      id: 1237,
      name: "Codeforces Global Round 26",
      startTimeSeconds: Math.floor(Date.now() / 1000) + 259200, // 3 days from now
      durationSeconds: 10800, // 3 hours
      phase: "BEFORE",
    },
  ],
}

// Simulate API response
console.log("Mock Codeforces API Response:")
console.log(JSON.stringify(mockCodeforcesContests, null, 2))

// Example of how to integrate with real Codeforces API:
/*
async function fetchCodeforcesContests() {
  try {
    const response = await fetch('https://codeforces.com/api/contest.list')
    const data = await response.json()
    
    if (data.status === 'OK') {
      const now = Math.floor(Date.now() / 1000)
      
      const ongoing = data.result.filter(contest => 
        contest.phase === 'CODING' && 
        contest.startTimeSeconds <= now &&
        contest.startTimeSeconds + contest.durationSeconds > now
      )
      
      const upcoming = data.result.filter(contest => 
        contest.phase === 'BEFORE' && 
        contest.startTimeSeconds > now
      ).slice(0, 10) // Limit to next 10 contests
      
      return { ongoing, upcoming }
    }
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error)
    return { ongoing: [], upcoming: [] }
  }
}
*/
