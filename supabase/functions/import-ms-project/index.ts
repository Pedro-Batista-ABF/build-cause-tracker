
// Edge function for importing MS Project XML files
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_XML_SIZE = 10 * 1024 * 1024; // 10MB limit

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

    // Check XML size to prevent timeouts
    if (xmlContent.length > MAX_XML_SIZE) {
      return new Response(
        JSON.stringify({ error: "XML file is too large (max 10MB)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    try {
      console.log("Parsing XML content...");
      
      // Use a timeout for parsing to prevent CPU exhaustion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      // Parse with timeout protection
      let xmlDoc;
      try {
        xmlDoc = parse(xmlContent);
        clearTimeout(timeoutId);
      } catch (parseError) {
        if (parseError.name === 'AbortError') {
          return new Response(
            JSON.stringify({ error: "XML parsing timed out. File may be too complex or malformed." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        throw parseError;
      }
      
      console.log("XML successfully parsed");
      
      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      // Process tasks from XML with optimized function
      const tasks = processTasksFromXml(xmlDoc);
      console.log(`Processed ${tasks.length} tasks from XML`);

      if (tasks.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "No tasks found in the XML file. The XML structure may not be compatible." 
          }),
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
          JSON.stringify({ error: `Failed to clear existing tasks: ${deleteError.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Insert tasks in smaller batches with increased delays
      const BATCH_SIZE = 5; // Reduced batch size for more stability
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
        
        // Add a longer delay between batches to prevent CPU overload
        if (i + BATCH_SIZE < totalTasks) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay to 500ms
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          taskCount: importedCount,
          message: `Successfully imported ${importedCount} tasks`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Error parsing XML:", parseError);
      return new Response(
        JSON.stringify({ error: `Failed to parse XML file: ${parseError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing import:", error);
    return new Response(
      JSON.stringify({ error: `Import failed: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Optimized task processing function with early bailout for large datasets
function processTasksFromXml(xmlDoc: any) {
  try {
    const tasks = [];
    let taskElements;
    
    // Find tasks in common MS Project XML structures
    if (xmlDoc.Project?.Tasks?.Task) {
      taskElements = xmlDoc.Project.Tasks.Task;
    } else if (xmlDoc.Project?.Task) {
      taskElements = xmlDoc.Project.Task;
    } else {
      // Simplified search approach to prevent excessive recursion
      const candidates = [
        xmlDoc.Project?.TaskTable?.Task,
        xmlDoc.Project?.Tasks,
        xmlDoc.Tasks?.Task,
        xmlDoc.TaskTable?.Task,
      ];
      
      for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          taskElements = candidate;
          break;
        } else if (candidate && typeof candidate === 'object') {
          taskElements = [candidate];
          break;
        }
      }
    }
    
    if (!taskElements) {
      console.log("No task elements found in any expected location");
      return [];
    }
    
    // Ensure we're working with an array
    if (!Array.isArray(taskElements)) {
      taskElements = [taskElements];
    }

    // Limit to first 500 tasks for very large files to prevent timeouts
    if (taskElements.length > 500) {
      console.log(`Too many tasks (${taskElements.length}), limiting to first 500`);
      taskElements = taskElements.slice(0, 500);
    }
    
    for (const taskElement of taskElements) {
      try {
        // Skip if not a valid task object
        if (!taskElement || typeof taskElement !== 'object') continue;
        
        // Extract task fields with better error handling
        const getField = (task: any, fieldName: string) => {
          if (!task) return null;
          const value = task[fieldName];
          if (value === undefined) return null;
          return Array.isArray(value) ? value[0] : value;
        };
        
        const uid = getField(taskElement, 'UID') || getField(taskElement, 'ID');
        const name = getField(taskElement, 'Name');
        
        if (!uid || !name || String(name).trim() === "") {
          continue;
        }
        
        const start = getField(taskElement, 'Start');
        const finish = getField(taskElement, 'Finish');
        const wbs = getField(taskElement, 'WBS');
        const outlineLevel = parseInt(getField(taskElement, 'OutlineLevel') || "1", 10);
        
        // Get baseline dates with explicit null handling
        const baselineStart = getField(taskElement, 'BaselineStart');
        const baselineFinish = getField(taskElement, 'BaselineFinish');
        
        // Get percentage complete with better validation
        let percentComplete = 0;
        const percentField = getField(taskElement, 'PercentComplete') || 
                           getField(taskElement, 'PercentageComplete') ||
                           getField(taskElement, 'Complete');
        
        if (percentField !== null && !isNaN(parseInt(percentField))) {
          percentComplete = parseInt(percentField, 10);
        }

        // Calculate duration in days with validation
        let durationDays = 0;
        if (start && finish) {
          const startDate = new Date(start);
          const finishDate = new Date(finish);
          if (!isNaN(startDate.getTime()) && !isNaN(finishDate.getTime())) {
            const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
            durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // Get predecessors with improved handling
        let predecessores = null;
        const predLinks = getField(taskElement, 'PredecessorLink');
        
        if (predLinks) {
          if (Array.isArray(predLinks)) {
            const link = predLinks[0];
            predecessores = getField(link, 'PredecessorUID') || null;
          } else if (typeof predLinks === 'object') {
            predecessores = getField(predLinks, 'PredecessorUID') || null;
          }
        }

        // Add task with validated fields
        tasks.push({
          tarefa_id: uid,
          nome: name,
          data_inicio: start || null,
          data_termino: finish || null,
          duracao_dias: durationDays || null,
          wbs: wbs || `${tasks.length + 1}`,
          percentual_previsto: percentComplete,
          percentual_real: percentComplete,
          nivel_hierarquia: outlineLevel || 1,
          atividade_lps_id: null,
          inicio_linha_base: baselineStart || null,
          termino_linha_base: baselineFinish || null,
          predecessores: predecessores
        });
      } catch (taskError) {
        console.error("Error processing task, skipping:", taskError);
        continue;
      }
    }

    return tasks;
  } catch (error) {
    console.error("Error in processTasksFromXml:", error);
    return [];
  }
}
