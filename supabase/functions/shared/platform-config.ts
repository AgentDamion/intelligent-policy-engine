import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

export const PlatformConfigurationInputSchema = z.object({
  organization_id: z.string().uuid(),
  platform_type: z.string().min(2),
  platform_name: z.string().min(1),
  configuration: z.record(z.any()),
  credentials: z.record(z.any()).optional(),
  field_mappings: z.record(z.any()).optional(),
  webhook_config: z.record(z.any()).optional(),
  status: z.enum(['active','inactive']).optional().default('active'),
})

export const PlatformConfigurationUpdateSchema = z.object({
  platform_type: z.string().min(2).optional(),
  platform_name: z.string().min(1).optional(),
  configuration: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  field_mappings: z.record(z.any()).optional(),
  webhook_config: z.record(z.any()).optional(),
  status: z.enum(['active','inactive']).optional(),
})

export type PlatformConfigurationInput = z.infer<typeof PlatformConfigurationInputSchema>
export type PlatformConfigurationUpdate = z.infer<typeof PlatformConfigurationUpdateSchema>


