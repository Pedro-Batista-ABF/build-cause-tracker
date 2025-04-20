
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

    try {
      console.log("Parsing XML content...");
      
      // Parse the XML using the deno xml parser
      const xmlDoc = parse(xmlContent);
      console.log("XML successfully parsed");
      
      // Debug the structure
      console.log("XML structure:", JSON.stringify(xmlDoc).substring(0, 500) + "...");

      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      // Process tasks from XML
      const tasks = processTasksFromXml(xmlDoc);
      console.log(`Processed ${tasks.length} tasks from XML`);

      if (tasks.length === 0) {
        console.log("No tasks found. XML structure may be different than expected.");
        // Additional debug info to understand the XML structure
        console.log("XML root keys:", Object.keys(xmlDoc));
        
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

function processTasksFromXml(xmlDoc: any) {
  try {
    const tasks = [];
    
    // Try to identify tasks in different possible XML structures
    let taskElements;
    
    // Common MS Project XML structures
    if (xmlDoc.Project?.Tasks?.Task) {
      // Structure: Project > Tasks > Task
      taskElements = xmlDoc.Project.Tasks.Task;
      console.log("Found tasks in Project.Tasks.Task structure");
    } else if (xmlDoc.Project?.Task) {
      // Structure: Project > Task
      taskElements = xmlDoc.Project.Task;
      console.log("Found tasks in Project.Task structure");
    } else {
      // Try to find any node that might contain tasks
      console.log("Looking for alternative task structures...");
      
      const findTasksInObject = (obj: any, path = ""): any[] => {
        if (!obj || typeof obj !== 'object') return [];
        
        // Check if this object is a task array
        if (Array.isArray(obj) && obj.length > 0 && obj[0].UID) {
          console.log(`Found potential tasks at ${path}`);
          return obj;
        }
        
        // If it's an array but not tasks, search in each element
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const result = findTasksInObject(obj[i], `${path}[${i}]`);
            if (result.length > 0) return result;
          }
          return [];
        }
        
        // Search in object properties
        for (const key in obj) {
          const result = findTasksInObject(obj[key], `${path}.${key}`);
          if (result.length > 0) return result;
        }
        
        return [];
      };
      
      taskElements = findTasksInObject(xmlDoc, "root");
    }
    
    if (!taskElements) {
      console.log("No task elements found in any expected location");
      return [];
    }
    
    // Ensure we're working with an array
    if (!Array.isArray(taskElements)) {
      console.log("Task elements found but not in array format, converting to array");
      taskElements = [taskElements];
    }

    console.log(`Found ${taskElements.length} task elements to process`);
    
    for (const taskElement of taskElements) {
      try {
        // Extract task fields with more flexible approach
        const getField = (task: any, fieldName: string) => {
          if (!task) return null;
          
          // Direct property access
          if (task[fieldName] !== undefined) {
            // Handle different potential formats
            const value = task[fieldName];
            if (Array.isArray(value)) return value[0];
            return value;
          }
          
          return null;
        };
        
        const uid = getField(taskElement, 'UID') || getField(taskElement, 'ID');
        const name = getField(taskElement, 'Name');
        
        if (!uid || !name || String(name).trim() === "") {
          console.log("Skipping task without UID or name:", JSON.stringify(taskElement).substring(0, 100));
          continue;
        }
        
        const start = getField(taskElement, 'Start');
        const finish = getField(taskElement, 'Finish');
        const wbs = getField(taskElement, 'WBS');
        const outlineLevel = parseInt(getField(taskElement, 'OutlineLevel') || "1", 10);
        
        // Get percentage complete
        let percentComplete = 0;
        const percentField = getField(taskElement, 'PercentComplete') || 
                            getField(taskElement, 'PercentageComplete') ||
                            getField(taskElement, 'Complete');
        
        if (percentField) {
          percentComplete = parseInt(percentField, 10);
        }

        // Calculate duration in days
        let durationDays = 0;
        if (start && finish) {
          const startDate = new Date(start);
          const finishDate = new Date(finish);
          const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
          durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else if (getField(taskElement, 'Duration')) {
          // Try to parse duration field if available
          const durationStr = getField(taskElement, 'Duration');
          // Rough estimate from duration string (PT40H0M0S format)
          if (typeof durationStr === 'string' && durationStr.includes('H')) {
            const hours = parseInt(durationStr.split('H')[0].replace('PT', ''), 10) || 0;
            durationDays = Math.ceil(hours / 8); // Assuming 8-hour workdays
          }
        }

        // Get predecessors - handle different possible structures
        const predecessors = [];
        const predLinks = getField(taskElement, 'PredecessorLink');
        
        if (predLinks) {
          if (Array.isArray(predLinks)) {
            for (const link of predLinks) {
              const predUid = getField(link, 'PredecessorUID');
              if (predUid) {
                predecessors.push(predUid);
              }
            }
          } else if (typeof predLinks === 'object') {
            const predUid = getField(predLinks, 'PredecessorUID');
            if (predUid) {
              predecessors.push(predUid);
            }
          }
        }

        tasks.push({
          tarefa_id: uid,
          nome: name,
          data_inicio: start || null,
          data_termino: finish || null,
          duracao_dias: durationDays,
          predecessores: predecessors.join(","),
          wbs: wbs || `${tasks.length + 1}`,
          percentual_previsto: percentComplete,
          percentual_real: percentComplete, // Initially set real to match planned
          nivel_hierarquia: outlineLevel,
          atividade_lps_id: null
        });
        
        console.log(`Processed task: ${name} (${uid})`);
      } catch (taskError) {
        console.error("Error processing task:", taskError);
        // Continue with the next task
      }
    }

    return tasks;
  } catch (error) {
    console.error("Error in processTasksFromXml:", error);
    return [];
  }
}
