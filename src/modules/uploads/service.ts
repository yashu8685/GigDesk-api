import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../../config/env.js'
import type { PresignInput } from './schemas.js'

function s3Configured(): boolean {
  return (
    env.S3_BUCKET !== undefined &&
    env.S3_REGION !== undefined &&
    env.S3_ACCESS_KEY_ID !== undefined &&
    env.S3_SECRET_ACCESS_KEY !== undefined
  )
}

/**
 * Issues a short-lived presigned PUT URL so clients upload files directly
 * to object storage — credentials never leave the server, files never
 * touch the API or the frontends.
 */
export async function presignUpload(input: PresignInput) {
  if (!s3Configured()) {
    // Dev fallback for Flutter without S3 — return a deterministic mock key that the API will accept as a URL proof
    const ext = input.contentType === 'image/png' ? 'png' : input.contentType === 'image/webp' ? 'webp' : 'jpg'
    const key = `${input.kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`
    const mockBase = 'https://mock-storage.gigdesk.local'
    return { uploadUrl: `${mockBase}/${key}?mockPresigned=1`, key, expiresIn: 300, mock: true as const }
  }

  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_ENDPOINT !== undefined,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  })

  const ext = input.contentType === 'image/png' ? 'png' : input.contentType === 'image/webp' ? 'webp' : 'jpg'
  const key = `${input.kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: input.contentType }),
    { expiresIn: 300 },
  )

  return { uploadUrl, key, expiresIn: 300 }
}
