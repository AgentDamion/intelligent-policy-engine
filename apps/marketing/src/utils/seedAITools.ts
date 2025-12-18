import { supabase } from "@/integrations/supabase/client";
import { sampleAITools } from "@/data/sampleAITools";

/**
 * Seed AI tools and versions into the database
 */
export async function seedAITools() {
  console.log('Starting AI tools seeding...');

  try {
    for (const tool of sampleAITools) {
      // Insert tool with new metadata fields
      const { data: toolData, error: toolError } = await supabase
        .from('ai_tool_registry' as any)
        .upsert({
          id: tool.id,
          name: tool.name,
          provider: tool.provider,
          category: tool.category,
          risk_tier: tool.risk_tier,
          deployment_status: tool.deployment_status,
          jurisdictions: tool.jurisdictions,
          data_sensitivity_used: tool.data_sensitivity_used,
          description: tool.description,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (toolError) {
        console.error(`Error inserting tool ${tool.name}:`, toolError);
        continue;
      }

      // Insert versions
      for (const version of tool.versions) {
        const { error: versionError } = await supabase
          .from('ai_tool_versions' as any)
          .upsert({
            id: version.id,
            tool_id: tool.id,
            version: version.version,
            release_date: version.release_date,
            capabilities: version.capabilities,
            known_limitations: version.known_limitations,
            notes: version.notes,
          }, { onConflict: 'id' });

        if (versionError) {
          console.error(`Error inserting version ${version.version}:`, versionError);
        }
      }
    }

    console.log('AI tools seeded successfully');
  } catch (error) {
    console.error('Error seeding AI tools:', error);
    throw error;
  }
}
