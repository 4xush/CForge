// This file would be placed in your backend API routes directory
// e.g., /api/leetcode/contests.js or /pages/api/leetcode/contests.js depending on your setup

import { NextResponse } from "next/server"
import NodeCache from "node-cache"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize cache with 10-minute TTL
const cache = new NodeCache({ stdTTL: 600 }) // 10 minutes

// Initialize rate limiter (if using Upstash Redis)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"), // 10 requests per minute
})

export async function GET(request) {
  try {
    // Check IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous"
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      )
    }

    // Check cache first
    const cacheKey = "leetcode-contests"
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      console.log("Returning cached LeetCode contests data")
      return NextResponse.json(cachedData)
    }

    // LeetCode uses GraphQL API
    console.log("Fetching fresh LeetCode contests data")
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      body: JSON.stringify({
        query: `
          query getContestList {
            allContests {
              title
              titleSlug
              startTime
              duration
              description
              id
            }
            activeContests {
              title
              titleSlug
              startTime
              duration
              description
              id
            }
          }
        `,
      }),
    })

    const data = await response.json()

    if (!data || data.errors) {
      throw new Error(`LeetCode API error: ${JSON.stringify(data.errors)}`)
    }

    const now = Math.floor(Date.now() / 1000)

    // Process contests
    // Convert LeetCode format to match our expected format
    const processContest = (contest) => ({
      id: contest.id,
      name: contest.title,
      titleSlug: contest.titleSlug,
      startTimeSeconds: contest.startTime,
      durationSeconds: contest.duration,
      description: contest.description,
    })

    const ongoing = data.data.activeContests.map(processContest)

    const upcoming = data.data.allContests
      .filter((contest) => contest.startTime > now)
      .map(processContest)
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 10) // Limit to next 10 contests

    const result = { ongoing, upcoming }

    // Store in cache
    cache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching LeetCode contests:", error)
    return NextResponse.json({ error: "Failed to fetch contests from LeetCode" }, { status: 500 })
  }
}
