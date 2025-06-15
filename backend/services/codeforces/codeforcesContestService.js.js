import { NextResponse } from "next/server"
import NodeCache from "node-cache"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize cache with 10-minute TTL
const cache = new NodeCache({ stdTTL: 600 }) // 10 minutes

// Initialize rate limiter (if using Upstash Redis)
// Replace with your Upstash Redis URL and token
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
    const cacheKey = "codeforces-contests"
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      console.log("Returning cached Codeforces contests data")
      return NextResponse.json(cachedData)
    }

    // Fetch from Codeforces API
    // console.log("Fetching fresh Codeforces contests data")
    const response = await fetch("https://codeforces.com/api/contest.list")
    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Codeforces API error: ${data.status}`)
    }

    const now = Math.floor(Date.now() / 1000)

    // Process contests
    const ongoing = data.result
      .filter(
        (contest) =>
          contest.phase === "CODING" &&
          contest.startTimeSeconds <= now &&
          contest.startTimeSeconds + contest.durationSeconds > now,
      )
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)

    const upcoming = data.result
      .filter((contest) => contest.phase === "BEFORE" && contest.startTimeSeconds > now)
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 10) // Limit to next 10 contests

    const result = { ongoing, upcoming }

    // Store in cache
    cache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching Codeforces contests:", error)
    return NextResponse.json({ error: "Failed to fetch contests from Codeforces" }, { status: 500 })
  }
}
