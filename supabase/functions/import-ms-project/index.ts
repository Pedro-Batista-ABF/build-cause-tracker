
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { xmlContent, projectId } = await req.json();
    
    if (!xmlContent || !projectId) {
      return new Response(
        JSON.stringify({ error: "XML content and project ID are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse the XML using the deno xml parser
    const xmlDoc = parse(xmlContent);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Process tasks from XML
    const tasks = processTasksFromXml(xmlDoc);
    console.log(`Processed ${tasks.length} tasks from XML`);

    if (tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No tasks found in the XML file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Clear existing tasks for this project before importing
    const { error: deleteError } = await supabaseClient
      .from("cronograma_projeto")
      .delete()
      .eq("projeto_id", projectId);

    if (deleteError) {
      console.error("Error deleting existing tasks:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to clear existing tasks" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert tasks in batches
    const BATCH_SIZE = 50;
    const totalTasks = tasks.length;
    let importedCount = 0;

    for (let i = 0; i < totalTasks; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE).map(task => ({
        ...task,
        projeto_id: projectId
      }));

      const { error: insertError } = await supabaseClient
        .from("cronograma_projeto")
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
        return new Response(
          JSON.stringify({ 
            error: `Failed to import tasks: ${insertError.message}`,
            importedCount 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      importedCount += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskCount: importedCount,
        message: `Successfully imported ${importedCount} tasks`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing import:", error);
    return new Response(
      JSON.stringify({ error: `Import failed: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function processTasksFromXml(xmlDoc: any) {
  const tasks = [];
  const taskElements = xmlDoc.Project?.Task || [];

  for (const taskElement of taskElements) {
    const uid = taskElement.UID?.[0];
    const name = taskElement.Name?.[0];
    
    if (!uid || !name || name.trim() === "") continue;

    const start = taskElement.Start?.[0];
    const finish = taskElement.Finish?.[0];
    const wbs = taskElement.WBS?.[0];
    const outlineLevel = parseInt(taskElement.OutlineLevel?.[0] || "1", 10);
    
    // Get percentage complete
    let percentComplete = 0;
    if (taskElement.PercentComplete?.[0]) {
      percentComplete = parseInt(taskElement.PercentComplete[0], 10);
    }

    // Calculate duration in days
    let durationDays = 0;
    if (start && finish) {
      const startDate = new Date(start);
      const finishDate = new Date(finish);
      const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get predecessors
    const predecessors = [];
    const predecessorLinks = taskElement.PredecessorLink || [];
    for (const link of predecessorLinks) {
      const predUid = link.PredecessorUID?.[0];
      if (predUid) {
        predecessors.push(predUid);
      }
    }

    tasks.push({
      tarefa_id: uid,
      nome: name,
      data_inicio: start || null,
      data_termino: finish || null,
      duracao_dias: durationDays,
      predecessores: predecessors.join(","),
      wbs,
      percentual_previsto: percentComplete,
      percentual_real: percentComplete, // Initially set real to match planned
      nivel_hierarquia: outlineLevel,
      atividade_lps_id: null
    });
  }

  return tasks;
}
