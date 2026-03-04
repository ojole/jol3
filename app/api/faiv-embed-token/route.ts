import { createHmac, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

const TOKEN_VERSION = 'v1'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function mintEmbedToken(secret: string): string {
  const timestampMs = Date.now()
  const nonce = randomUUID()
  const payload = `${timestampMs}.${nonce}`
  const signature = sign(secret, payload)
  return `${TOKEN_VERSION}.${timestampMs}.${nonce}.${signature}`
}

function buildResponse() {
  const secret = process.env.FAIV_EMBED_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'FAIV_EMBED_SECRET is not configured.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  const embedBaseUrl =
    (process.env.FAIV_EMBED_BASE_URL || process.env.NEXT_PUBLIC_FAIV_EMBED_BASE_URL || 'https://faiv.ai').replace(/\/+$/, '')
  const token = mintEmbedToken(secret)

  return NextResponse.json(
    { token, embedBaseUrl },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}

export async function GET() {
  return buildResponse()
}

export async function POST() {
  return buildResponse()
}

