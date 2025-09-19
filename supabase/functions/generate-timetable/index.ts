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

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting timetable generation...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { academic_year, semester, departments, config }: TimetableRequest = await req.json();
    console.log('Request data:', { academic_year, semester, departments });

    // Create a new timetable run
    const { data: run, error: runError } = await supabaseClient
      .from('timetable_runs')
      .insert({
        name: `Generated Timetable - ${academic_year} Semester ${semester}`,
        academic_year,
        semester,
        status: 'generating',
        generation_config: config || {
          algorithm: 'greedy',
          max_iterations: 100
        }
      })
      .select()
      .single();

    if (runError) {
      console.error('Run creation error:', runError);
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
      console.error('Assignments error:', assignmentsError);
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    if (!assignments || assignments.length === 0) {
      throw new Error('No course assignments found for the specified criteria');
    }

    console.log(`Found ${assignments.length} assignments`);

    // Get available rooms
    const { data: rooms, error: roomsError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('is_active', true);

    if (roomsError) {
      console.error('Rooms error:', roomsError);
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    if (!rooms || rooms.length === 0) {
      throw new Error('No active rooms found');
    }

    console.log(`Found ${rooms.length} rooms`);

    // Define time slots (9 AM to 6 PM, 1 hour each)
    const timeSlots = [
      { start_time: '09:00:00', end_time: '10:00:00' },
      { start_time: '10:00:00', end_time: '11:00:00' },
      { start_time: '11:00:00', end_time: '12:00:00' },
      { start_time: '12:00:00', end_time: '13:00:00' },
      { start_time: '13:00:00', end_time: '14:00:00' },
      { start_time: '14:00:00', end_time: '15:00:00' },
      { start_time: '15:00:00', end_time: '16:00:00' },
      { start_time: '16:00:00', end_time: '17:00:00' },
      { start_time: '17:00:00', end_time: '18:00:00' },
    ];

    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    
    // Simple scheduling algorithm
    const finalSchedule: any[] = [];
    let scheduledCount = 0;

    for (const assignment of assignments) {
      const requiredHours = assignment.hours_per_week || 3;
      const requiredCapacity = (assignment.batch?.student_count || 30) + 5;
      
      console.log(`Scheduling: ${assignment.course?.name} for ${assignment.batch?.name} (${requiredHours} hours)`);

      let scheduledHours = 0;
      
      // Find a suitable room
      const suitableRoom = rooms.find(room => room.capacity >= requiredCapacity);
      if (!suitableRoom) {
        console.log(`No suitable room found for ${assignment.course?.name}`);
        continue;
      }

      // Try to schedule required hours
      for (let hour = 0; hour < requiredHours && scheduledHours < requiredHours; hour++) {
        const dayIndex = hour % days.length;
        const timeSlotIndex = Math.floor(hour / days.length) % timeSlots.length;
        
        const day = days[dayIndex];
        const timeSlot = timeSlots[timeSlotIndex];

        // Check if this slot is already taken
        const isSlotTaken = finalSchedule.some(schedule => 
          schedule.day_of_week === day && 
          schedule.start_time === timeSlot.start_time &&
          (schedule.batch_id === assignment.batch_id || 
           schedule.course_assignment_id === assignment.course_assignment_id)
        );

        if (!isSlotTaken) {
          finalSchedule.push({
            run_id: run.id,
            course_assignment_id: assignment.id,
            batch_id: assignment.batch_id,
            room_id: suitableRoom.id,
            day_of_week: day,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
          });

          scheduledHours++;
          scheduledCount++;
          
          console.log(`✓ Scheduled: ${assignment.course?.name} - Day ${day}, ${timeSlot.start_time}-${timeSlot.end_time}, Room: ${suitableRoom.name}`);
        }
      }
    }

    console.log(`Generated ${finalSchedule.length} timetable entries`);

    // Insert generated timetable
    if (finalSchedule.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('timetables')
        .insert(finalSchedule);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert timetable: ${insertError.message}`);
      }

      console.log(`Successfully inserted ${finalSchedule.length} timetable entries`);
    }

    // Update run status to completed
    const { error: updateError } = await supabaseClient
      .from('timetable_runs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', run.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.id,
        statistics: {
          total_assignments: assignments.length,
          fully_scheduled: scheduledCount,
          partially_scheduled: assignments.length - scheduledCount,
          total_slots_created: finalSchedule.length
        },
        message: `Generated timetable with ${finalSchedule.length} scheduled slots. ${scheduledCount}/${assignments.length} assignments scheduled.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-timetable function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);