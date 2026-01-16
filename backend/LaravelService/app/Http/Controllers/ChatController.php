<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    /**
     * Get all chat sessions for current user
     */
    public function getSessions(Request $request)
    {
        $sessions = ChatSession::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'userId' => $session->user_id,
                    'title' => $session->title,
                    'createdAt' => $session->created_at,
                    'updatedAt' => $session->created_at, // Use createdAt as updatedAt since we don't track updates
                ];
            });

        return response()->json($sessions);
    }

    /**
     * Create new chat session
     */
    public function createSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $session = ChatSession::create([
            'user_id' => $request->user()->id,
            'title' => $request->title ?? 'New Chat', // Default title like SpringService
        ]);

        return response()->json([
            'id' => $session->id,
            'userId' => $session->user_id,
            'title' => $session->title,
            'createdAt' => $session->created_at,
            'updatedAt' => $session->created_at,
        ], 201);
    }

    /**
     * Delete chat session
     */
    public function deleteSession(Request $request, $id)
    {
        $session = ChatSession::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$session) {
            return $this->error('Session not found', 404);
        }

        // Delete all messages first (cascade)
        $session->messages()->delete();
        $session->delete();

        return response()->json(['message' => 'Session deleted successfully']);
    }

    /**
     * Get messages for a session
     */
    public function getMessages(Request $request, $sessionId)
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$session) {
            return $this->error('Session not found', 404);
        }

        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('timestamp', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'sessionId' => $msg->session_id,
                    'sender' => $msg->sender,
                    'message' => $msg->message,
                    'timestamp' => $msg->timestamp,
                ];
            });

        return response()->json($messages);
    }

    /**
     * Add message to session
     */
    public function addMessage(Request $request, $sessionId)
    {
        $validator = Validator::make($request->all(), [
            'sender' => 'required|in:USER,AI',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$session) {
            return $this->error('Session not found', 404);
        }

        $message = ChatMessage::create([
            'session_id' => $sessionId,
            'sender' => $request->sender,
            'message' => $request->message,
            'timestamp' => now(),
        ]);

        return response()->json([
            'id' => $message->id,
            'sessionId' => $message->session_id,
            'sender' => $message->sender,
            'message' => $message->message,
            'timestamp' => $message->timestamp,
        ], 201);
    }

    /**
     * Get messages for internal API (Python service)
     */
    public function getMessagesInternal($sessionId)
    {
        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('timestamp', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'sessionId' => $msg->session_id,
                    'sender' => $msg->sender,
                    'message' => $msg->message,
                    'timestamp' => $msg->timestamp,
                ];
            });

        return response()->json($messages);
    }
}
