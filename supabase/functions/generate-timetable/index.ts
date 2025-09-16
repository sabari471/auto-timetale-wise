import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimetableRequest {
  academic_year: string;
  semester: number;
  departments?: string[];
  config?: any;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { academic_year, semester, departments, config }: TimetableRequest = await req.json();

    console.log('Generating timetable for:', { academic_year, semester, departments });

    // Create a new timetable run
    const { data: run, error: runError } = await supabaseClient
      .from('timetable_runs')
      .insert({
        name: `Generated Timetable - ${academic_year} Semester ${semester}`,
        academic_year,
        semester,
        status: 'generating',
        generation_config: config || {
          algorithm: 'genetic',
          max_iterations: 500,
          population_size: 30
        }
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create timetable run: ${runError.message}`);
    }

    console.log('Created timetable run:', run.id);

    // Get all course assignments for the semester
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('course_assignments')
      .select(`
        *,
        course:courses(*),
        faculty:faculty(*),
        batch:batches(*)
      `)
      .eq('academic_year', academic_year)
      .eq('semester', semester);

    if (assignmentsError) {
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    // Get available rooms
    const { data: rooms, error: roomsError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('is_active', true);

    if (roomsError) {
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    console.log(`Processing ${assignments.length} assignments with ${rooms.length} rooms`);

    // Simple greedy algorithm for timetable generation
    const timeSlots: TimeSlot[] = [
      { start_time: '09:00', end_time: '10:00' },
      { start_time: '10:00', end_time: '11:00' },
      { start_time: '11:00', end_time: '12:00' },
      { start_time: '14:00', end_time: '15:00' }, // After lunch
      { start_time: '15:00', end_time: '16:00' },
      { start_time: '16:00', end_time: '17:00' },
    ];

    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    const schedule: any[] = [];
    const conflictMap = new Map<string, Set<string>>(); // Track conflicts

    // Initialize conflict tracking
    for (const day of days) {
      for (const slot of timeSlots) {
        conflictMap.set(`${day}-${slot.start_time}`, new Set());
      }
    }

    let scheduled = 0;
    let failed = 0;

    for (const assignment of assignments) {
      let isScheduled = false;
      const hoursNeeded = assignment.hours_per_week || 3;
      let hoursScheduled = 0;

      // Try to schedule the required hours for this assignment
      while (hoursScheduled < hoursNeeded && !isScheduled) {
        for (const day of days) {
          if (hoursScheduled >= hoursNeeded) break;

          for (const slot of timeSlots) {
            if (hoursScheduled >= hoursNeeded) break;

            const slotKey = `${day}-${slot.start_time}`;
            const conflicts = conflictMap.get(slotKey);

            // Check for conflicts
            const batchKey = `batch-${assignment.batch.id}`;
            const facultyKey = `faculty-${assignment.faculty.id}`;

            if (!conflicts?.has(batchKey) && !conflicts?.has(facultyKey)) {
              // Find suitable room
              const suitableRoom = rooms.find(room => {
                const roomKey = `room-${room.id}`;
                return !conflicts?.has(roomKey) && 
                       room.capacity >= (assignment.batch.student_count + 5); // Buffer
              });

              if (suitableRoom) {
                // Schedule this slot
                schedule.push({
                  run_id: run.id,
                  course_assignment_id: assignment.id,
                  batch_id: assignment.batch.id,
                  room_id: suitableRoom.id,
                  day_of_week: day,
                  start_time: slot.start_time,
                  end_time: slot.end_time
                });

                // Mark conflicts
                conflicts?.add(batchKey);
                conflicts?.add(facultyKey);
                conflicts?.add(`room-${suitableRoom.id}`);

                hoursScheduled++;
                console.log(`Scheduled: ${assignment.course.name} for ${assignment.batch.name} on day ${day} at ${slot.start_time}`);
              }
            }
          }
        }

        if (hoursScheduled < hoursNeeded) {
          console.warn(`Could not fully schedule ${assignment.course.name} - ${assignment.batch.name}. Scheduled ${hoursScheduled}/${hoursNeeded} hours`);
          failed++;
          break;
        } else {
          scheduled++;
          isScheduled = true;
        }
      }
    }

    // Insert generated timetable
    if (schedule.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('timetables')
        .insert(schedule);

      if (insertError) {
        throw new Error(`Failed to insert timetable: ${insertError.message}`);
      }
    }

    // Update timetable run status
    const { error: updateError } = await supabaseClient
      .from('timetable_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        generation_log: `Successfully scheduled ${scheduled} assignments. ${failed} had conflicts.`
      })
      .eq('id', run.id);

    if (updateError) {
      console.error('Failed to update run status:', updateError);
    }

    console.log(`Timetable generation completed. Run ID: ${run.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.id,
        scheduled_count: scheduled,
        failed_count: failed,
        total_slots: schedule.length,
        message: `Generated timetable with ${schedule.length} scheduled slots`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-timetable function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);