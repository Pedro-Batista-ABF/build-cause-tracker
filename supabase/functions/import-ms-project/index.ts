
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    if (!xmlDoc) {
      return new Response(
        JSON.stringify({ error: "Failed to parse XML content" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

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

    // Insert tasks in batches (to avoid payload size limitations)
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

function processTasksFromXml(xmlDoc: Document) {
  const tasks = [];
  const taskElements = xmlDoc.querySelectorAll("Task");

  taskElements.forEach((taskElement) => {
    // Check if this is a real task or summary element
    const uid = taskElement.querySelector("UID")?.textContent;
    const name = taskElement.querySelector("Name")?.textContent;
    
    if (!uid || !name) return;

    // Skip summary tasks without names
    if (name.trim() === "") return;

    // Extract task data
    const wbs = taskElement.querySelector("WBS")?.textContent || "";
    const outlineLevel = parseInt(taskElement.querySelector("OutlineLevel")?.textContent || "1", 10);
    const start = taskElement.querySelector("Start")?.textContent;
    const finish = taskElement.querySelector("Finish")?.textContent;
    
    // Get percentage complete
    let percentComplete = 0;
    const percentCompleteNode = taskElement.querySelector("PercentComplete");
    if (percentCompleteNode && percentCompleteNode.textContent) {
      percentComplete = parseInt(percentCompleteNode.textContent, 10);
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
    const predecessorLinks = taskElement.querySelectorAll("PredecessorLink");
    predecessorLinks.forEach(link => {
      const predUid = link.querySelector("PredecessorUID")?.textContent;
      if (predUid) {
        predecessors.push(predUid);
      }
    });

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
  });

  return tasks;
}
