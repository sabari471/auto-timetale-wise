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

interface ScheduleSlot {
  day: number;
  slot_index: number;
  start_time: string;
  end_time: string;
  batch_id?: number;
  faculty_id?: number;
  room_id?: number;
  assignment_id?: number;
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

    // Clear existing timetables for this academic year and semester
    const { error: deleteError } = await supabaseClient
      .from('timetables')
      .delete()
      .eq('academic_year', academic_year)
      .eq('semester', semester);

    if (deleteError) {
      console.warn('Warning: Could not clear existing timetables:', deleteError.message);
    }

    // Create a new timetable run
    const { data: run, error: runError } = await supabaseClient
      .from('timetable_runs')
      .insert({
        name: `Generated Timetable - ${academic_year} Semester ${semester}`,
        academic_year,
        semester,
        status: 'generating',
        generation_config: config || {
          algorithm: 'improved_greedy',
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
    let assignmentsQuery = supabaseClient
      .from('course_assignments')
      .select(`
        *,
        course:courses(*),
        faculty:faculty(*),
        batch:batches(*)
      `)
      .eq('academic_year', academic_year)
      .eq('semester', semester);

    // Filter by departments if specified
    if (departments && departments.length > 0) {
      assignmentsQuery = assignmentsQuery.in('department', departments);
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) {
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    if (!assignments || assignments.length === 0) {
      throw new Error('No course assignments found for the specified criteria');
    }

    // Get available rooms
    const { data: rooms, error: roomsError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('is_active', true);

    if (roomsError) {
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    if (!rooms || rooms.length === 0) {
      throw new Error('No active rooms found');
    }

    console.log(`Processing ${assignments.length} assignments with ${rooms.length} rooms`);

    // Define time slots
    const timeSlots: TimeSlot[] = [
      { start_time: '09:00:00', end_time: '10:00:00' },
      { start_time: '10:00:00', end_time: '11:00:00' },
      { start_time: '11:00:00', end_time: '12:00:00' },
      { start_time: '12:00:00', end_time: '13:00:00' },
      { start_time: '14:00:00', end_time: '15:00:00' }, 
      { start_time: '15:00:00', end_time: '16:00:00' },
      { start_time: '16:00:00', end_time: '17:00:00' },
      { start_time: '17:00:00', end_time: '18:00:00' },
    ];

    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    
    // Initialize schedule grid
    const scheduleGrid: ScheduleSlot[][][] = [];
    for (let day = 0; day < days.length; day++) {
      scheduleGrid[day] = [];
      for (let slot = 0; slot < timeSlots.length; slot++) {
        scheduleGrid[day][slot] = [];
      }
    }

    // Helper function to check if a slot is available
    const isSlotAvailable = (day: number, slotIndex: number, batchId: number, facultyId: number, roomId: number): boolean => {
      const daySlots = scheduleGrid[day][slotIndex];
      
      // Check batch conflict
      if (daySlots.some(s => s.batch_id === batchId)) return false;
      
      // Check faculty conflict
      if (daySlots.some(s => s.faculty_id === facultyId)) return false;
      
      // Check room conflict
      if (daySlots.some(s => s.room_id === roomId)) return false;
      
      return true;
    };

    // Helper function to find suitable room
    const findSuitableRoom = (day: number, slotIndex: number, requiredCapacity: number): any => {
      return rooms.find(room => {
        // Check capacity
        if (room.capacity < requiredCapacity) return false;
        
        // Check availability
        return !scheduleGrid[day][slotIndex].some(s => s.room_id === room.id);
      });
    };

    // Sort assignments by priority (fewer available slots first)
    const sortedAssignments = [...assignments].sort((a, b) => {
      const hoursA = a.hours_per_week || 3;
      const hoursB = b.hours_per_week || 3;
      return hoursB - hoursA; // More hours first
    });

    const finalSchedule: any[] = [];
    let totalScheduled = 0;
    let totalFailed = 0;

    // Generate timetable for each assignment
    for (const assignment of sortedAssignments) {
      const requiredHours = assignment.hours_per_week || 3;
      const requiredCapacity = (assignment.batch?.student_count || 30) + 5; // Add buffer
      let scheduledHours = 0;

      console.log(`Scheduling: ${assignment.course?.name} for ${assignment.batch?.name} (${requiredHours} hours needed)`);

      // Try to schedule required hours
      for (let attempt = 0; attempt < requiredHours * 2 && scheduledHours < requiredHours; attempt++) {
        let scheduled = false;

        for (let dayIndex = 0; dayIndex < days.length && !scheduled; dayIndex++) {
          for (let slotIndex = 0; slotIndex < timeSlots.length && !scheduled; slotIndex++) {
            const day = days[dayIndex];
            const slot = timeSlots[slotIndex];

            // Find suitable room
            const room = findSuitableRoom(dayIndex, slotIndex, requiredCapacity);
            
            if (room && isSlotAvailable(dayIndex, slotIndex, assignment.batch_id, assignment.faculty_id, room.id)) {
              // Schedule this slot
              const scheduleSlot: ScheduleSlot = {
                day,
                slot_index: slotIndex,
                start_time: slot.start_time,
                end_time: slot.end_time,
                batch_id: assignment.batch_id,
                faculty_id: assignment.faculty_id,
                room_id: room.id,
                assignment_id: assignment.id
              };

              scheduleGrid[dayIndex][slotIndex].push(scheduleSlot);

              finalSchedule.push({
                run_id: run.id,
                course_assignment_id: assignment.id,
                batch_id: assignment.batch_id,
                faculty_id: assignment.faculty_id,
                room_id: room.id,
                day_of_week: day,
                start_time: slot.start_time,
                end_time: slot.end_time,
                academic_year,
                semester,
                course_name: assignment.course?.name,
                batch_name: assignment.batch?.name,
                faculty_name: assignment.faculty?.name,
                room_name: room.name
              });

              scheduledHours++;
              scheduled = true;
              
              console.log(`✓ Scheduled: ${assignment.course?.name} - Day ${day}, ${slot.start_time}-${slot.end_time}, Room: ${room.name}`);
            }
          }
        }
      }

      if (scheduledHours >= requiredHours) {
        totalScheduled++;
        console.log(`✓ Fully scheduled: ${assignment.course?.name} (${scheduledHours}/${requiredHours} hours)`);
      } else {
        totalFailed++;
        console.log(`⚠ Partially scheduled: ${assignment.course?.name} (${scheduledHours}/${requiredHours} hours)`);
      }
    }

    // Insert generated timetable
    if (finalSchedule.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('timetables')
        .insert(finalSchedule);

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw new Error(`Failed to insert timetable: ${insertError.message}`);
      }

      console.log(`Successfully inserted ${finalSchedule.length} timetable entries`);
    }

    // Update timetable run status
    const completionLog = {
      total_assignments: assignments.length,
      fully_scheduled: totalScheduled,
      partially_scheduled: totalFailed,
      total_slots_created: finalSchedule.length,
      generation_timestamp: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('timetable_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        generation_log: JSON.stringify(completionLog)
      })
      .eq('id', run.id);

    if (updateError) {
      console.error('Failed to update run status:', updateError);
    }

    console.log(`Timetable generation completed. Run ID: ${run.id}`);
    console.log(`Stats: ${totalScheduled} fully scheduled, ${totalFailed} partial/failed, ${finalSchedule.length} total slots`);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.id,
        statistics: {
          total_assignments: assignments.length,
          fully_scheduled: totalScheduled,
          partially_scheduled: totalFailed,
          total_slots_created: finalSchedule.length
        },
        message: `Generated timetable with ${finalSchedule.length} scheduled slots. ${totalScheduled}/${assignments.length} assignments fully scheduled.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-timetable function:', error);
    
    // Try to update run status to failed if we have a run
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(serve_handler);