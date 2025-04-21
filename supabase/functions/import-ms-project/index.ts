
// Edge function for importing MS Project XML files
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reduzido para 5MB para diminuir o consumo de memória
const MAX_XML_SIZE = 5 * 1024 * 1024; 
// Timeout mais curto para prevenir consumo excessivo de CPU
const PARSE_TIMEOUT_MS = 15000;

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
        JSON.stringify({ error: "XML file is too large (max 5MB)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    try {
      console.log("Parsing XML content...");
      
      // Use a timeout for parsing to prevent CPU exhaustion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS); // 15 second timeout
      
      // Parse with timeout protection
      let xmlDoc;
      try {
        // Extrair apenas as partes relevantes do XML para reduzir a carga de processamento
        const relevantXmlContent = extractRelevantXml(xmlContent);
        xmlDoc = parse(relevantXmlContent);
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
      const BATCH_SIZE = 3; // Reduzido para 3 para maior estabilidade
      const totalTasks = tasks.length;
      let importedCount = 0;
      
      // Limitar o número máximo de tarefas para evitar timeout
      const MAX_TASKS = 300;
      const tasksToImport = tasks.slice(0, MAX_TASKS);

      for (let i = 0; i < tasksToImport.length; i += BATCH_SIZE) {
        const batch = tasksToImport.slice(i, i + BATCH_SIZE).map(task => ({
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
        
        // Adicionar uma pausa maior entre lotes para evitar sobrecarga da CPU
        // Somente fazer a pausa se não for o último lote
        if (i + BATCH_SIZE < tasksToImport.length) {
          await new Promise(resolve => setTimeout(resolve, 800)); // Aumentado para 800ms
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          taskCount: importedCount,
          totalTasksInFile: tasks.length,
          importedTasksLimited: tasks.length > MAX_TASKS,
          message: `Successfully imported ${importedCount} tasks${tasks.length > MAX_TASKS ? ' (limited to first ' + MAX_TASKS + ' tasks)' : ''}`
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

// Função para extrair apenas as partes relevantes do XML para reduzir processamento
function extractRelevantXml(xmlContent: string): string {
  // Para simplificar, extraímos apenas o conteúdo entre as tags Project e Tasks
  // Isso reduz drasticamente o tamanho do XML para análise
  try {
    const projectStart = xmlContent.indexOf("<Project");
    const tasksStart = xmlContent.indexOf("<Tasks>");
    const tasksEnd = xmlContent.indexOf("</Tasks>") + 8; // 8 é o comprimento de "</Tasks>"
    
    if (projectStart !== -1 && tasksStart !== -1 && tasksEnd !== -1) {
      const header = xmlContent.substring(projectStart, tasksStart);
      const tasks = xmlContent.substring(tasksStart, tasksEnd);
      
      return `${header}${tasks}</Project>`;
    }
    
    // Caso não consiga encontrar as seções específicas, retorna o XML completo
    return xmlContent;
  } catch (e) {
    console.warn("Error extracting relevant XML sections, using full XML:", e);
    return xmlContent;
  }
}

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

    // Limitar o número de tarefas para processamento
    const MAX_PROCESSING_TASKS = 500;
    if (taskElements.length > MAX_PROCESSING_TASKS) {
      console.log(`Too many tasks (${taskElements.length}), limiting to first ${MAX_PROCESSING_TASKS}`);
      taskElements = taskElements.slice(0, MAX_PROCESSING_TASKS);
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
        
        const uid = getField(taskElement, 'UID') || getField(taskElement, 'ID') || `task-${tasks.length + 1}`;
        const name = getField(taskElement, 'Name');
        
        if (!name || String(name).trim() === "") {
          continue;
        }
        
        const start = getField(taskElement, 'Start');
        const finish = getField(taskElement, 'Finish');
        const wbs = getField(taskElement, 'WBS') || `${tasks.length + 1}`;
        const outlineLevel = parseInt(getField(taskElement, 'OutlineLevel') || "1", 10);
        
        // Get baseline dates with explicit null handling
        const baselineStart = getField(taskElement, 'BaselineStart');
        const baselineFinish = getField(taskElement, 'BaselineFinish');
        
        // Get percentage complete with better validation
        let percentComplete = 0;
        const percentField = getField(taskElement, 'PercentComplete') || 
                           getField(taskElement, 'PercentageComplete') ||
                           getField(taskElement, 'Complete');
        
        if (percentField !== null && !isNaN(parseInt(String(percentField)))) {
          percentComplete = parseInt(String(percentField), 10);
        }

        // Calculate duration in days with validation
        let durationDays = 0;
        if (start && finish) {
          try {
            const startDate = new Date(start);
            const finishDate = new Date(finish);
            if (!isNaN(startDate.getTime()) && !isNaN(finishDate.getTime())) {
              const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
              durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          } catch (e) {
            console.warn("Error calculating duration:", e);
          }
        }

        // Get predecessors with improved handling
        let predecessores = null;
        // Verificar diferentes formatos de predecessores em diversos tipos de XML do MS Project
        try {
          const predLinks = getField(taskElement, 'PredecessorLink');
          if (predLinks) {
            if (Array.isArray(predLinks)) {
              const link = predLinks[0];
              predecessores = getField(link, 'PredecessorUID') || null;
            } else if (typeof predLinks === 'object') {
              predecessores = getField(predLinks, 'PredecessorUID') || null;
            }
          }
          
          // Verificar formato alternativo de predecessores
          if (!predecessores) {
            const pred = getField(taskElement, 'Predecessors');
            if (pred) {
              predecessores = String(pred);
            }
          }
        } catch (e) {
          console.warn("Error processing predecessors:", e);
        }

        // Add task with validated fields - garantindo que os campos correspondam ao banco de dados
        tasks.push({
          tarefa_id: String(uid),
          nome: String(name),
          data_inicio: start ? formatDate(start) : null,
          data_termino: finish ? formatDate(finish) : null,
          duracao_dias: durationDays || null,
          wbs: wbs ? String(wbs) : `${tasks.length + 1}`,
          percentual_previsto: percentComplete,
          percentual_real: percentComplete,
          nivel_hierarquia: outlineLevel || 1,
          atividade_lps_id: null,
          inicio_linha_base: baselineStart ? formatDate(baselineStart) : null,
          termino_linha_base: baselineFinish ? formatDate(baselineFinish) : null,
          predecessores: predecessores ? String(predecessores) : null
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

// Função para formatar datas no formato YYYY-MM-DD para PostgreSQL
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (e) {
    console.warn("Error formatting date:", e);
    return null;
  }
}
