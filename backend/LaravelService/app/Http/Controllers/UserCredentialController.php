<?php

namespace App\Http\Controllers;

use App\Models\UserCredential;
use App\Services\CredentialEncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserCredentialController extends Controller
{
    protected $encryption;

    public function __construct(CredentialEncryptionService $encryption)
    {
        $this->encryption = $encryption;
    }

    /**
     * Get all credentials for current user
     */
    public function index(Request $request)
    {
        $category = $request->query('category');
        $active = $request->query('active', true);

        $query = UserCredential::where('user_id', $request->user()->id);

        if ($category) {
            $query->where('category', strtoupper($category));
        }

        if ($active) {
            $query->where('is_active', true);
        }

        $credentials = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($cred) {
                return $this->formatCredential($cred, false);
            });

        return response()->json($credentials);
    }

    /**
     * Create new credential
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serviceName' => 'required|string|max:100',
            'serviceUrl' => 'nullable|string|max:500',
            'serviceType' => 'nullable|in:WEB,API,APP,OTHER',
            'username' => 'required|string',
            'password' => 'required|string',
            'purpose' => 'required|string',
            'description' => 'nullable|string',
            'category' => 'nullable|in:EDUCATION,ENTERTAINMENT,SOCIAL,WORK,FINANCE,HEALTH,OTHER',
            'tags' => 'nullable|array',
            'label' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $credential = UserCredential::create([
            'user_id' => $request->user()->id,
            'service_name' => $request->serviceName,
            'service_url' => $request->serviceUrl,
            'service_type' => $request->serviceType ?? 'WEB',
            'encrypted_username' => $this->encryption->encrypt($request->username),
            'encrypted_password' => $this->encryption->encrypt($request->password),
            'purpose' => $request->purpose,
            'description' => $request->description,
            'category' => $request->category ?? 'OTHER',
            'tags' => $request->tags ? json_encode($request->tags) : null,
            'label' => $request->label,
            'is_active' => true,
            'is_shared' => false,
            'usage_count' => 0,
        ]);

        return response()->json($this->formatCredential($credential, false), 201);
    }

    /**
     * Get credential by ID
     */
    public function show(Request $request, $id)
    {
        $decrypt = $request->query('decrypt', false);

        $credential = UserCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        return response()->json($this->formatCredential($credential, $decrypt));
    }

    /**
     * Update credential
     */
    public function update(Request $request, $id)
    {
        $credential = UserCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'serviceName' => 'string|max:100',
            'serviceUrl' => 'nullable|string|max:500',
            'serviceType' => 'nullable|in:WEB,API,APP,OTHER',
            'username' => 'string',
            'password' => 'string',
            'purpose' => 'string',
            'description' => 'nullable|string',
            'category' => 'nullable|in:EDUCATION,ENTERTAINMENT,SOCIAL,WORK,FINANCE,HEALTH,OTHER',
            'tags' => 'nullable|array',
            'label' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        if ($request->has('serviceName')) {
            $credential->service_name = $request->serviceName;
        }
        if ($request->has('serviceUrl')) {
            $credential->service_url = $request->serviceUrl;
        }
        if ($request->has('serviceType')) {
            $credential->service_type = $request->serviceType;
        }
        if ($request->has('username')) {
            $credential->encrypted_username = $this->encryption->encrypt($request->username);
        }
        if ($request->has('password')) {
            $credential->encrypted_password = $this->encryption->encrypt($request->password);
        }
        if ($request->has('purpose')) {
            $credential->purpose = $request->purpose;
        }
        if ($request->has('description')) {
            $credential->description = $request->description;
        }
        if ($request->has('category')) {
            $credential->category = $request->category;
        }
        if ($request->has('tags')) {
            $credential->tags = json_encode($request->tags);
        }
        if ($request->has('label')) {
            $credential->label = $request->label;
        }

        $credential->save();

        return response()->json($this->formatCredential($credential, false));
    }

    /**
     * Delete credential
     */
    public function destroy(Request $request, $id)
    {
        $credential = UserCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        $credential->delete();

        return response()->json(['message' => 'Credential deleted successfully']);
    }

    /**
     * Search credentials
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $query = $request->query;
        $credentials = UserCredential::where('user_id', $request->user()->id)
            ->where(function ($q) use ($query) {
                $q->where('service_name', 'LIKE', '%' . $query . '%')
                  ->orWhere('purpose', 'LIKE', '%' . $query . '%')
                  ->orWhere('description', 'LIKE', '%' . $query . '%')
                  ->orWhere('label', 'LIKE', '%' . $query . '%');
            })
            ->get()
            ->map(function ($cred) {
                return $this->formatCredential($cred, false);
            });

        return response()->json($credentials);
    }

    /**
     * Log credential usage
     */
    public function logUsage(Request $request, $id)
    {
        $credential = UserCredential::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        $credential->last_used_at = now();
        $credential->usage_count = ($credential->usage_count ?? 0) + 1;
        $credential->last_success = true;
        $credential->save();

        return response()->json(['message' => 'Usage logged']);
    }

    /**
     * Get credentials by user ID (internal API - no auth)
     */
    public function getByUserId($userId)
    {
        $credentials = UserCredential::where('user_id', $userId)
            ->where('is_active', true)
            ->get()
            ->map(function ($cred) {
                return $this->formatCredential($cred, true); // Include decrypted for internal use
            });

        return response()->json($credentials);
    }

    /**
     * Get decrypted credential (internal API - no auth)
     */
    public function getDecrypted($id)
    {
        $credential = UserCredential::find($id);

        if (!$credential) {
            return $this->error('Credential not found', 404);
        }

        return response()->json($this->formatCredential($credential, true));
    }

    private function formatCredential($credential, $decrypt = false)
    {
        $data = [
            'id' => $credential->id,
            'userId' => $credential->user_id,
            'serviceName' => $credential->service_name,
            'serviceUrl' => $credential->service_url,
            'serviceType' => $credential->service_type,
            'purpose' => $credential->purpose,
            'description' => $credential->description,
            'category' => $credential->category,
            'tags' => $credential->tags_list,
            'label' => $credential->label,
            'isActive' => $credential->is_active,
            'isShared' => $credential->is_shared,
            'lastUsedAt' => $credential->last_used_at,
            'usageCount' => $credential->usage_count,
            'lastSuccess' => $credential->last_success,
            'createdAt' => $credential->created_at,
            'updatedAt' => $credential->updated_at,
        ];

        if ($decrypt) {
            $data['username'] = $this->encryption->decrypt($credential->encrypted_username);
            $data['password'] = $this->encryption->decrypt($credential->encrypted_password);
        } else {
            $data['username'] = '****';
            $data['password'] = '****';
        }

        return $data;
    }
}
