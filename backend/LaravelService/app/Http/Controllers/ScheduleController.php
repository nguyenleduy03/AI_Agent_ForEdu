<?php

namespace App\Http\Controllers;

use App\Models\UserSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Get all schedules for current user
     */
    public function index(Request $request)
    {
        $schedules = UserSchedule::where('user_id', $request->user()->id)
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                return $this->formatSchedule($schedule);
            });

        return response()->json($schedules);
    }

    /**
     * Get schedules for a date range
     */
    public function getByDateRange(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $schedules = UserSchedule::where('user_id', $request->user()->id)
            ->whereBetween('start_time', [$request->startDate, $request->endDate])
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                return $this->formatSchedule($schedule);
            });

        return response()->json($schedules);
    }

    /**
     * Create new schedule
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'startTime' => 'required|date',
            'endTime' => 'required|date|after:startTime',
            'location' => 'nullable|string|max:255',
            'isRecurring' => 'boolean',
            'recurrencePattern' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $schedule = UserSchedule::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'start_time' => $request->startTime,
            'end_time' => $request->endTime,
            'location' => $request->location,
            'is_recurring' => $request->isRecurring ?? false,
            'recurrence_pattern' => $request->recurrencePattern,
        ]);

        return response()->json($this->formatSchedule($schedule), 201);
    }

    /**
     * Update schedule
     */
    public function update(Request $request, $id)
    {
        $schedule = UserSchedule::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$schedule) {
            return $this->error('Schedule not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'startTime' => 'date',
            'endTime' => 'date',
            'location' => 'nullable|string|max:255',
            'isRecurring' => 'boolean',
            'recurrencePattern' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $schedule->fill([
            'title' => $request->title ?? $schedule->title,
            'description' => $request->description ?? $schedule->description,
            'start_time' => $request->startTime ?? $schedule->start_time,
            'end_time' => $request->endTime ?? $schedule->end_time,
            'location' => $request->location ?? $schedule->location,
            'is_recurring' => $request->isRecurring ?? $schedule->is_recurring,
            'recurrence_pattern' => $request->recurrencePattern ?? $schedule->recurrence_pattern,
        ]);
        $schedule->save();

        return response()->json($this->formatSchedule($schedule));
    }

    /**
     * Delete schedule
     */
    public function destroy(Request $request, $id)
    {
        $schedule = UserSchedule::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$schedule) {
            return $this->error('Schedule not found', 404);
        }

        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted successfully']);
    }

    /**
     * Get today's schedules
     */
    public function today(Request $request)
    {
        $today = now()->startOfDay();
        $tomorrow = now()->endOfDay();

        $schedules = UserSchedule::where('user_id', $request->user()->id)
            ->whereBetween('start_time', [$today, $tomorrow])
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                return $this->formatSchedule($schedule);
            });

        return response()->json($schedules);
    }

    private function formatSchedule($schedule)
    {
        return [
            'id' => $schedule->id,
            'userId' => $schedule->user_id,
            'title' => $schedule->title,
            'description' => $schedule->description,
            'startTime' => $schedule->start_time,
            'endTime' => $schedule->end_time,
            'location' => $schedule->location,
            'isRecurring' => $schedule->is_recurring,
            'recurrencePattern' => $schedule->recurrence_pattern,
            'googleEventId' => $schedule->google_event_id,
            'createdAt' => $schedule->created_at,
            'updatedAt' => $schedule->updated_at,
        ];
    }
}
