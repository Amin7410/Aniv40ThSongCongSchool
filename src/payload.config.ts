import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { vi } from '@payloadcms/translations/languages/vi'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media, SubmissionFiles } from './collections/Media'
import { AuditLogs, Cities, Exhibits, Milestones, QuizQuestions, Zones } from './collections/Content'
import { Candles, Submissions } from './collections/Submissions'
import { Yearbooks } from './collections/Yearbooks'
import { EventSettings, FundSettings, SiteSettings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (process.env.NODE_ENV === 'production' && (process.env.PAYLOAD_SECRET || '').length < 32) {
  throw new Error('PAYLOAD_SECRET phải dài ít nhất 32 ký tự ở môi trường production')
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' – Quản trị Phòng truyền thống' },
    // Không dùng Gravatar: tránh gửi băm email quản trị ra dịch vụ bên ngoài (và bị CSP chặn)
    avatar: 'default',
  },
  i18n: { supportedLanguages: { vi }, fallbackLanguage: 'vi' },
  collections: [Zones, Exhibits, Milestones, QuizQuestions, Yearbooks, Media, Submissions, SubmissionFiles, Candles, Cities, Users, AuditLogs],
  globals: [SiteSettings, EventSettings, FundSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  csrf: [process.env.NEXT_PUBLIC_SITE_URL || ''].filter(Boolean),
  cors: [process.env.NEXT_PUBLIC_SITE_URL || ''].filter(Boolean),
  graphQL: { disable: true },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // dev: tự đồng bộ schema; production: dùng migration (pnpm payload migrate)
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Email giao dịch: chỉ bật khi có SMTP (chưa có thì email được ghi ra log).
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no-reply@localhost',
        defaultFromName: 'Phòng truyền thống THPT Sông Công',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
          requireTLS: Number(process.env.SMTP_PORT || 587) === 587,
        },
      })
    : undefined,
  upload: { limits: { fileSize: 200 * 1024 * 1024 } },
})
