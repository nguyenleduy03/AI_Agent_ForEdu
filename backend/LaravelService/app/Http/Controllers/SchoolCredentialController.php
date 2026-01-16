<?php

namespace App\Http\Controllers;

use App\Models\UserSchoolCredential;
use App\Services\CredentialEncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SchoolCredentialController extends Controller
{
    protected $encryption;

    public function __construct(CredentialEncryptionService $encryption)
    {
        $this->encryption = $encryption;
    }

    /**
     * Get all school credentials for current user
     */
    public function index(Request $request)
    {
        $credentials = UserSchoolCredential::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($cred) {
                return $this->formatCredential($cred);
            });

        return response()->json($credentials);
    }

    /**
     * Create new school credential
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schoolName' => 'required|string|max:255',
            'studentId' => 'required|string|max:50',
            'username' => 'required|string',
            'password' => 'required|string',
            'portalUrl' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $credential = UserSchoolCredential::create([
            'user_id' => $request->user()->id,
            'school_name' => $request->schoolName,
            'student_id' => $request->studentId,
            'encrypted_username' => $this->encryption->encrypt($request->username),
            'encrypted_password' => $this->encryption->encrypt($request->password),
            'portal_url' => $request->portalUrl,
            'notes' => $request->notes,
        ]);

        return response()->json($this->formatCredential($credential), 201);
    }

    /**
     * Get school credential with decrypted values
     */
    public function show(Request $request, $id)
    {
        $credential = UserSchoolCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        return response()->json([
            'id' => $credential->id,
            'schoolName' => $credential->school_name,
            'studentId' => $credential->student_id,
            'username' => $this->encryption->decrypt($credential->encrypted_username),
            'password' => $this->encryption->decrypt($credential->encrypted_password),
            'portalUrl' => $credential->portal_url,
            'notes' => $credential->notes,
            'createdAt' => $credential->created_at,
        ]);
    }

    /**
     * Update school credential
     */
    public function update(Request $request, $id)
    {
        $credential = UserSchoolCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'schoolName' => 'string|max:255',
            'studentId' => 'string|max:50',
            'username' => 'string',
            'password' => 'string',
            'portalUrl' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        if ($request->has('schoolName')) {
            $credential->school_name = $request->schoolName;
        }
        if ($request->has('studentId')) {
            $credential->student_id = $request->studentId;
        }
        if ($request->has('username')) {
            $credential->encrypted_username = $this->encryption->encrypt($request->username);
        }
        if ($request->has('password')) {
            $credential->encrypted_password = $this->encryption->encrypt($request->password);
        }
        if ($request->has('portalUrl')) {
            $credential->portal_url = $request->portalUrl;
        }
        if ($request->has('notes')) {
            $credential->notes = $request->notes;
        }

        $credential->save();

        return response()->json($this->formatCredential($credential));
    }

    /**
     * Delete school credential
     */
    public function destroy(Request $request, $id)
    {
        $credential = UserSchoolCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        $credential->delete();

        return response()->json(['message' => 'School credential deleted successfully']);
    }

    /**
     * Get credential by school name (for Python service)
     */
    public function getBySchoolName(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schoolName' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $credential = UserSchoolCredential::where('user_id', $request->user()->id)
            ->where('school_name', 'LIKE', '%' . $request->schoolName . '%')
            ->first();

        if (!$credential) {
            return $this->error('School credential not found', 404);
        }

        return response()->json([
            'id' => $credential->id,
            'schoolName' => $credential->school_name,
            'studentId' => $credential->student_id,
            'username' => $this->encryption->decrypt($credential->encrypted_username),
            'password' => $this->encryption->decrypt($credential->encrypted_password),
            'portalUrl' => $credential->portal_url,
        ]);
    }

    private function formatCredential($credential)
    {
        return [
            'id' => $credential->id,
            'schoolName' => $credential->school_name,
            'studentId' => $credential->student_id,
            'portalUrl' => $credential->portal_url,
            'notes' => $credential->notes,
            'createdAt' => $credential->created_at,
            'updatedAt' => $credential->updated_at,
        ];
    }
}
