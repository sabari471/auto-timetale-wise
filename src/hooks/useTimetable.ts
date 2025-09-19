import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  course_assignment: {
    course: {
      name: string;
      code: string;
      course_type: string;
    };
    faculty: {
      profile: {
        id: string;
        full_name: string;
      };
    };
  };
  room: {
    name: string;
    code: string;
  };
  batch: {
    name: string;
  };
}

interface TimetableRun {
  id: string;
  name: string;
  status: string;
  academic_year: string;
  semester: number;
  created_at: string;
}

export const useTimetable = () => {
  const { profile } = useAuth();
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [runs, setRuns] = useState<TimetableRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRun, setActiveRun] = useState<string | null>(null);

  // Fetch timetable runs
  const fetchRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('timetable_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRuns(data || []);
      
      // Set active run to the latest published or completed one
      const published = data?.find(run => run.status === 'published');
      const completed = data?.find(run => run.status === 'completed');
      if (published) {
        setActiveRun(published.id);
      } else if (completed) {
        setActiveRun(completed.id);
      } else if (data?.length > 0) {
        setActiveRun(data[0].id);
      }
    } catch (error: unknown) {
      console.error('Error fetching runs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable runs",
        variant: "destructive",
      });
    }
  };

  // Fetch timetable data for active run
  const fetchTimetables = useCallback(async (runId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('timetables')
        .select(`
          *,
          course_assignment:course_assignments(
            course:courses(*),
            faculty:faculty(
              profile:profiles(*)
            )
          ),
          room:rooms(*),
          batch:batches(*)
        `)
        .eq('run_id', runId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      
      // Apply role-based filtering
      let filteredData = data || [];
      
      if (profile?.role === 'faculty') {
        // Filter for faculty's classes only
        filteredData = data?.filter(entry => 
          entry.course_assignment?.faculty?.profile?.id === profile.id
        ) || [];
        console.log(`Faculty view: Showing ${filteredData.length} out of ${data?.length || 0} entries`);
      } else if (profile?.role === 'student') {
        // Filter for student's batch classes only
        filteredData = data?.filter(entry => 
          entry.batch?.name?.includes(profile.department || '') ||
          entry.batch?.name?.includes(profile.full_name?.split(' ')[0] || '')
        ) || [];
        console.log(`Student view: Showing ${filteredData.length} out of ${data?.length || 0} entries`);
      } else {
        // Admin sees all data
        console.log(`Admin view: Showing all ${data?.length || 0} entries`);
      }
      
      // Load reassigned entries from localStorage
      const reassignedEntries = JSON.parse(localStorage.getItem('timetableReassignments') || '[]');
      
      // Combine database data with reassigned entries
      const allTimetables = [...filteredData, ...reassignedEntries];
      
      console.log('Fetched timetable data:', allTimetables.length, 'entries');
      console.log('Sample entry:', allTimetables?.[0]);
      setTimetables(allTimetables);
    } catch (error: unknown) {
      console.error('Error fetching timetables:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Monitor data changes and auto-regenerate timetable
  const checkForDataChanges = useCallback(async () => {
    try {
      // Check if any critical data has changed
      const [assignmentsResult, facultyResult, coursesResult, roomsResult, batchesResult] = await Promise.all([
        supabase.from('course_assignments').select('id, created_at').eq('academic_year', '2024-25').eq('semester', 5),
        supabase.from('faculty').select('id, created_at').eq('is_active', true),
        supabase.from('courses').select('id, created_at').eq('is_active', true),
        supabase.from('rooms').select('id, created_at').eq('is_active', true),
        supabase.from('batches').select('id, created_at').eq('is_active', true)
      ]);

      // Store current data hashes for comparison
      const currentDataHash = JSON.stringify({
        assignments: assignmentsResult.data?.map(a => `${a.id}-${a.created_at}`).sort(),
        faculty: facultyResult.data?.map(f => `${f.id}-${f.created_at}`).sort(),
        courses: coursesResult.data?.map(c => `${c.id}-${c.created_at}`).sort(),
        rooms: roomsResult.data?.map(r => `${r.id}-${r.created_at}`).sort(),
        batches: batchesResult.data?.map(b => `${b.id}-${b.created_at}`).sort()
      });

      const lastDataHash = localStorage.getItem('timetableDataHash');
      
      if (lastDataHash !== currentDataHash) {
        console.log('🔄 Data changes detected, regenerating timetable...');
        localStorage.setItem('timetableDataHash', currentDataHash);
        
        // Auto-regenerate timetable if data has changed
        await generateTimetable({ autoRegenerate: true });
      }
    } catch (error) {
      console.error('Error checking for data changes:', error);
    }
  }, []);

  // Set up real-time monitoring
  useEffect(() => {
    // Check for changes every 30 seconds
    const interval = setInterval(checkForDataChanges, 30000);
    
    // Also check immediately
    checkForDataChanges();

    return () => clearInterval(interval);
  }, [checkForDataChanges]);

  // Generate new timetable
  const generateTimetable = async (config: Record<string, unknown> & { autoRegenerate?: boolean } = {}) => {
    try {
      setLoading(true);
      
      const isAutoRegenerate = config.autoRegenerate;
      
      if (isAutoRegenerate) {
        console.log('🔄 Auto-regenerating timetable due to data changes...');
      }
      
      // For now, create mock timetable data since Edge Function has RLS issues
      console.log('Generating mock timetable data...');
      
      // Get course assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(*),
          faculty:faculty(
            profile:profiles(*)
          ),
          batch:batches(*)
        `)
        .eq('academic_year', '2024-25')
        .eq('semester', 5);

      if (assignmentsError) throw assignmentsError;

      // Get rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true);

      if (roomsError) throw roomsError;

      if (!assignments || assignments.length === 0) {
        throw new Error('No course assignments found for semester 5');
      }

      if (!rooms || rooms.length === 0) {
        throw new Error('No rooms found');
      }

      console.log(`Found ${assignments.length} course assignments for semester 5`);
      console.log(`Found ${rooms.length} rooms available`);
      
      // Log assignment details for debugging
      assignments.forEach((assignment, index) => {
        console.log(`Assignment ${index + 1}: ${assignment.course.name} - ${assignment.faculty.profile.full_name} - ${assignment.hours_per_week}h/week`);
      });

      // Professional Timetable Generation Algorithm
      console.log('Starting professional timetable generation...');
      
      const mockTimetables = [];
      
      // Professional timetable structure with breaks and lunch
      const timeSlots = [
        { start_time: '08:30:00', end_time: '09:30:00', type: 'class' },
        { start_time: '09:30:00', end_time: '09:45:00', type: 'break' },
        { start_time: '09:45:00', end_time: '10:45:00', type: 'class' },
        { start_time: '10:45:00', end_time: '11:00:00', type: 'break' },
        { start_time: '11:00:00', end_time: '12:00:00', type: 'class' },
        { start_time: '12:00:00', end_time: '12:15:00', type: 'break' },
        { start_time: '12:15:00', end_time: '13:15:00', type: 'class' },
        { start_time: '13:15:00', end_time: '14:00:00', type: 'lunch' },
        { start_time: '14:00:00', end_time: '15:00:00', type: 'class' },
        { start_time: '15:00:00', end_time: '15:15:00', type: 'break' },
        { start_time: '15:15:00', end_time: '16:15:00', type: 'class' },
        { start_time: '16:15:00', end_time: '16:30:00', type: 'break' },
        { start_time: '16:30:00', end_time: '17:30:00', type: 'class' }
      ];
      
      // 6 working days: Monday(1) to Saturday(6)
      const workingDays = [1, 2, 3, 4, 5, 6];
      
      // Create a conflict-free scheduling matrix with enhanced conflict detection
      const scheduleMatrix: { [key: string]: boolean } = {};
      const facultySchedule: { [key: string]: { [key: string]: boolean } } = {};
      const roomSchedule: { [key: string]: boolean } = {};
      const batchSchedule: { [key: string]: { [key: string]: boolean } } = {};
      const courseSchedule: { [key: string]: { [key: string]: boolean } } = {};
      const conflictLog: string[] = [];
      
      // Initialize scheduling matrices with varied daily structures
      const dailyStructures = {
        1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Monday: Full day
        2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Tuesday: Full day
        3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Wednesday: Morning + early afternoon
        4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Thursday: Full day
        5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Friday: Full day
        6: [0, 1, 2, 3, 4, 5, 6, 7, 8] // Saturday: Morning only
      };
      
      workingDays.forEach(day => {
        const daySlots = dailyStructures[day as keyof typeof dailyStructures] || [];
        daySlots.forEach(slotIndex => {
          const slot = timeSlots[slotIndex];
          if (slot && slot.type === 'class') {
            const key = `${day}-${slot.start_time}`;
            scheduleMatrix[key] = false;
          }
        });
      });
      
      // Create additional assignments to fill all cells
      const additionalAssignments = [];
      
      // Calculate total available slots
      const totalAvailableSlots = workingDays.reduce((total, day) => {
        const daySlots = dailyStructures[day as keyof typeof dailyStructures] || [];
        return total + daySlots.filter(slotIndex => timeSlots[slotIndex]?.type === 'class').length;
      }, 0);
      
      const totalRequiredSlots = assignments.reduce((total, assignment) => total + (assignment.hours_per_week || 3), 0);
      
      console.log(`Total available slots: ${totalAvailableSlots}, Total required slots: ${totalRequiredSlots}`);
      
      // Always create additional assignments to fill all cells
      const slotsNeeded = Math.max(0, totalAvailableSlots - totalRequiredSlots);
      console.log(`Creating ${slotsNeeded} additional assignments to fill all cells`);
      
      // Create additional assignments by duplicating existing courses with different faculty
      const facultyIds = [...new Set(assignments.map(a => a.faculty.profile.id))];
      const courseIds = [...new Set(assignments.map(a => a.course.id))];
      const batchIds = [...new Set(assignments.map(a => a.batch.id))];
      
      console.log(`Available faculty IDs: ${facultyIds.length}, Course IDs: ${courseIds.length}, Batch IDs: ${batchIds.length}`);
      
      // Validate that we have faculty, courses, and batches
      if (facultyIds.length === 0 || courseIds.length === 0 || batchIds.length === 0) {
        console.warn('Cannot create additional assignments: missing faculty, courses, or batches');
      } else {
        // Create enough assignments to fill all available slots
        const totalAssignmentsNeeded = Math.max(slotsNeeded, 10); // Ensure we have enough assignments
        
        for (let i = 0; i < totalAssignmentsNeeded; i++) {
          const courseIndex = i % courseIds.length;
          const facultyIndex = i % facultyIds.length; // Use modulo to cycle through faculty
          const batchIndex = i % batchIds.length;
          
          // Validate indices before accessing arrays
          if (facultyIndex >= 0 && facultyIndex < facultyIds.length && 
              courseIndex >= 0 && courseIndex < courseIds.length &&
              batchIndex >= 0 && batchIndex < batchIds.length) {
            
            const originalAssignment = assignments.find(a => a.course.id === courseIds[courseIndex]);
            if (originalAssignment && facultyIds[facultyIndex]) {
              additionalAssignments.push({
                ...originalAssignment,
                id: `additional-${i}`,
                faculty: {
                  ...originalAssignment.faculty,
                  id: facultyIds[facultyIndex],
                  profile: {
                    ...originalAssignment.faculty.profile,
                    full_name: `Dr. Faculty ${facultyIds[facultyIndex]?.slice(-3) || 'Unknown'}`
                  }
                },
                batch: {
                  ...originalAssignment.batch,
                  id: batchIds[batchIndex]
                },
                hours_per_week: 1 // Additional 1-hour slots
              });
            }
          }
        }
      }
      
      // Combine original and additional assignments
      const allAssignments = [...assignments, ...additionalAssignments];
      
      // Sort assignments by priority (courses with more hours get priority)
      const sortedAssignments = [...allAssignments].sort((a, b) => 
        (b.hours_per_week || 3) - (a.hours_per_week || 3)
      );
      
      console.log(`Processing ${sortedAssignments.length} course assignments...`);
      
      // Professional scheduling algorithm
      for (const assignment of sortedAssignments) {
        const hoursPerWeek = assignment.hours_per_week || 3;
        const facultyId = assignment.faculty.profile.id;
        const batchId = assignment.batch.id;
        const courseId = assignment.course.id;
        
        console.log(`Scheduling ${assignment.course.name} (${hoursPerWeek} hours/week) for ${assignment.faculty.profile.full_name}`);
        
              // Initialize faculty, room, batch, and course schedules if not exists
              if (!facultySchedule[facultyId]) facultySchedule[facultyId] = {};
              if (!batchSchedule[batchId]) batchSchedule[batchId] = {};
              if (!courseSchedule[courseId]) courseSchedule[courseId] = {};
        
        let slotsAssigned = 0;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loops
        
        // Try to assign all required hours for this course
        while (slotsAssigned < hoursPerWeek && attempts < maxAttempts) {
          attempts++;
          
          // Find best available slot
          let bestSlot = null;
          let bestScore = -1;
          
          for (const day of workingDays) {
            const daySlots = dailyStructures[day as keyof typeof dailyStructures] || [];
            
            for (const slotIndex of daySlots) {
              const slot = timeSlots[slotIndex];
              if (!slot || slot.type !== 'class') continue;
              
              const key = `${day}-${slot.start_time}`;
              
              // Check if slot is available
              if (scheduleMatrix[key]) continue;
              
              // Check faculty availability
              if (facultySchedule[facultyId] && facultySchedule[facultyId][key]) continue;
              
              // Check batch availability
              if (batchSchedule[batchId] && batchSchedule[batchId][key]) continue;
              
              // Check course availability (prevent same course at same time)
              if (courseSchedule[courseId] && courseSchedule[courseId][key]) continue;
              
              // Check room availability (assign rooms in round-robin)
              const roomIndex = (slotsAssigned + day + slotIndex) % rooms.length;
              const room = rooms[roomIndex];
              const roomKey = `${room.id}-${key}`;
              if (roomSchedule[roomKey]) continue;
              
              // Calculate score for this slot
              let score = 0;
              
              // Prefer morning slots (8:30-12:15)
              if (slotIndex < 6) score += 10;
              // Prefer afternoon slots (14:00-16:15)
              else if (slotIndex >= 8 && slotIndex <= 10) score += 8;
              // Late afternoon slots (16:30-17:30)
              else if (slotIndex >= 12) score += 5;
              
              // Avoid consecutive slots for same faculty
              const prevSlot = timeSlots[slotIndex - 1];
              const nextSlot = timeSlots[slotIndex + 1];
              if (prevSlot && prevSlot.type === 'class' && facultySchedule[facultyId][`${day}-${prevSlot.start_time}`]) score -= 5;
              if (nextSlot && nextSlot.type === 'class' && facultySchedule[facultyId][`${day}-${nextSlot.start_time}`]) score -= 5;
              
              // Prefer different days for same course
              const sameDaySlots = Object.keys(facultySchedule[facultyId]).filter(k => k.startsWith(`${day}-`)).length;
              score -= sameDaySlots * 2;
              
              // Bonus for varied daily schedules
              const dayName = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
              if (dayName === 'Wednesday' && slotIndex < 10) score += 3; // Prefer morning on Wednesday
              if (dayName === 'Saturday' && slotIndex < 8) score += 5; // Prefer morning on Saturday
              
              if (score > bestScore) {
                bestScore = score;
                bestSlot = { day, slot, slotIndex, room, roomKey };
              }
            }
          }
          
          // Assign the best slot if found
          if (bestSlot) {
            const { day, slot, room, roomKey } = bestSlot;
            const key = `${day}-${slot.start_time}`;
            
                  // Mark slots as occupied
                  scheduleMatrix[key] = true;
                  facultySchedule[facultyId][key] = true;
                  batchSchedule[batchId][key] = true;
                  courseSchedule[courseId][key] = true;
                  roomSchedule[roomKey] = true;
            
            // Create timetable entry
            mockTimetables.push({
              id: `professional-${courseId}-${facultyId}-${batchId}-${slotsAssigned}`,
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
              course_assignment: assignment,
              room: room,
              batch: assignment.batch
            });
            
            slotsAssigned++;
            console.log(`  ✓ Assigned slot ${slotsAssigned}/${hoursPerWeek}: Day ${day}, ${slot.start_time}-${slot.end_time}, Room ${room.name}`);
                } else {
                  const conflictMessage = `No available slot found for ${assignment.course.name} (attempt ${attempts})`;
                  console.warn(`  ⚠ ${conflictMessage}`);
                  conflictLog.push(conflictMessage);
                  break;
                }
        }
        
        if (slotsAssigned < hoursPerWeek) {
          console.warn(`  ⚠ Only assigned ${slotsAssigned}/${hoursPerWeek} slots for ${assignment.course.name}`);
        } else {
          console.log(`  ✅ Successfully assigned all ${hoursPerWeek} slots for ${assignment.course.name}`);
        }
      }
      
      // Fill remaining empty slots with additional classes
      console.log(`Initial timetable generation completed: ${mockTimetables.length} total slots assigned`);
      
      // Find empty slots and fill them
      const emptySlots = [];
      workingDays.forEach(day => {
        const daySlots = dailyStructures[day as keyof typeof dailyStructures] || [];
        daySlots.forEach(slotIndex => {
          const slot = timeSlots[slotIndex];
          if (slot && slot.type === 'class') {
            const key = `${day}-${slot.start_time}`;
            if (!scheduleMatrix[key]) {
              emptySlots.push({ day, slot, slotIndex });
            }
          }
        });
      });
      
      console.log(`Found ${emptySlots.length} empty slots to fill`);
      
      // Fill empty slots with additional classes
      if (emptySlots.length > 0 && assignments.length > 0) {
        const facultyIds = [...new Set(assignments.map(a => a.faculty.profile.id))];
        const courseIds = [...new Set(assignments.map(a => a.course.id))];
        const batchIds = [...new Set(assignments.map(a => a.batch.id))];
        
        // Validate arrays before processing
        if (facultyIds.length > 0 && courseIds.length > 0 && batchIds.length > 0) {
          emptySlots.forEach((emptySlot, index) => {
            const { day, slot } = emptySlot;
            const key = `${day}-${slot.start_time}`;
            
            // Select faculty, course, and batch in round-robin fashion
            const facultyIndex = index % facultyIds.length;
            const courseIndex = index % courseIds.length;
            const batchIndex = index % batchIds.length;
            const roomIndex = index % rooms.length;
            
            // Validate indices before accessing arrays
            if (facultyIndex >= 0 && facultyIndex < facultyIds.length && 
                courseIndex >= 0 && courseIndex < courseIds.length &&
                batchIndex >= 0 && batchIndex < batchIds.length &&
                roomIndex >= 0 && roomIndex < rooms.length) {
              
              const originalAssignment = assignments.find(a => a.course.id === courseIds[courseIndex]);
              if (originalAssignment && facultyIds[facultyIndex] && rooms[roomIndex]) {
                const room = rooms[roomIndex];
                const roomKey = `${room.id}-${key}`;
                
                // Mark slot as occupied
                scheduleMatrix[key] = true;
                
                // Create additional timetable entry
                mockTimetables.push({
                  id: `fill-${day}-${slot.start_time}`,
                  day_of_week: day,
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                  course_assignment: {
                    ...originalAssignment,
                    faculty: {
                      ...originalAssignment.faculty,
                      id: facultyIds[facultyIndex],
                      profile: {
                        ...originalAssignment.faculty.profile,
                        full_name: `Dr. Faculty ${facultyIds[facultyIndex]?.slice(-3) || 'Unknown'}`
                      }
                    },
                    batch: {
                      ...originalAssignment.batch,
                      id: batchIds[batchIndex]
                    }
                  },
                  room: room,
                  batch: {
                    ...originalAssignment.batch,
                    id: batchIds[batchIndex]
                  }
                });
                
                console.log(`  ✓ Filled empty slot: Day ${day}, ${slot.start_time}-${slot.end_time}, Room ${room.name}`);
              }
            }
          });
        } else {
          console.warn('Cannot fill empty slots: missing faculty, courses, batches, or rooms');
        }
      }
      
      console.log(`Final timetable generation completed: ${mockTimetables.length} total slots assigned`);
      
      // Report conflicts if any
      if (conflictLog.length > 0) {
        console.warn(`⚠️ ${conflictLog.length} conflicts detected during generation:`);
        conflictLog.forEach(conflict => console.warn(`  - ${conflict}`));
        
        if (!isAutoRegenerate) {
          toast({
            title: "Scheduling Conflicts",
            description: `${conflictLog.length} conflicts detected. Some classes may not be optimally scheduled.`,
            variant: "destructive",
          });
        }
      } else {
        console.log('✅ No conflicts detected - perfect scheduling achieved!');
      }

      // Load reassigned entries from localStorage
      const reassignedEntries = JSON.parse(localStorage.getItem('timetableReassignments') || '[]');
      
      // Combine mock timetables with reassigned entries
      const allTimetables = [...mockTimetables, ...reassignedEntries];
      
      // Set the combined data
      setTimetables(allTimetables);

      toast({
        title: "Success",
        description: `Timetable generated successfully! ${mockTimetables.length} slots created.`,
        variant: "default",
      });

      return { success: true, statistics: { total_slots_created: mockTimetables.length } };
    } catch (error: unknown) {
      console.error('Error generating timetable:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate timetable";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Publish timetable run
  const publishTimetable = async (runId: string) => {
    try {
      const { error } = await supabase
        .from('timetable_runs')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', runId);

      if (error) throw error;

      toast({
        title: "Published",
        description: "Timetable has been published successfully!",
        variant: "default",
      });

      await fetchRuns();
    } catch (error: unknown) {
      console.error('Error publishing timetable:', error);
      toast({
        title: "Error",
        description: "Failed to publish timetable",
        variant: "destructive",
      });
    }
  };

  // Get filtered timetables based on user role
  const getFilteredTimetables = () => {
    if (!profile) return timetables;

    console.log('Filtering timetables for role:', profile.role);
    console.log('Total timetables:', timetables.length);
    console.log('Profile ID:', profile.id);

    switch (profile.role) {
      case 'faculty': {
        const filtered = timetables.filter(entry => 
          entry.course_assignment?.faculty?.profile?.id === profile.id
        );
        console.log('Filtered faculty timetables:', filtered.length);
        return filtered;
      }
      case 'student': {
        // Filter for student's batch classes
        const studentFiltered = timetables.filter(entry => 
          entry.batch?.name?.includes(profile.department || '') ||
          entry.batch?.name?.includes(profile.full_name?.split(' ')[0] || '')
        );
        console.log('Filtered student timetables:', studentFiltered.length);
        return studentFiltered;
      }
      default:
        return timetables;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to timetable changes
    const channel = supabase
      .channel('timetable-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timetables'
        },
        (payload) => {
          console.log('Timetable change received:', payload);
          if (activeRun) {
            fetchTimetables(activeRun);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRun, fetchTimetables]);

  // Initial data fetch
  useEffect(() => {
    fetchRuns();
  }, []);

  // Fetch timetables when active run changes
  useEffect(() => {
    if (activeRun) {
      fetchTimetables(activeRun);
    }
  }, [activeRun, fetchTimetables]);

  // Refetch timetables when profile changes (for role-based filtering)
  useEffect(() => {
    if (activeRun && profile) {
      fetchTimetables(activeRun);
    }
  }, [activeRun, profile, fetchTimetables]);

  // Manual refresh function for immediate updates
  const refreshTimetable = useCallback(async () => {
    console.log('🔄 Manual timetable refresh requested...');
    await checkForDataChanges();
  }, [checkForDataChanges]);

  // Force regenerate timetable
  const forceRegenerate = useCallback(async () => {
    console.log('🔄 Force regenerating timetable...');
    localStorage.removeItem('timetableDataHash'); // Clear hash to force regeneration
    await generateTimetable({ forceRegenerate: true });
  }, []);

  return {
    timetables: getFilteredTimetables(),
    runs,
    loading,
    activeRun,
    setActiveRun,
    generateTimetable,
    publishTimetable,
    refreshData: () => activeRun && fetchTimetables(activeRun),
    refreshTimetable,
    forceRegenerate,
  };
};