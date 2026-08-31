<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string',
        ]);

        $otp = (string) rand(100000, 999999);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'customer',
            'otp' => $otp,
            'otp_expires_at' => now()->addMinutes(15),
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otp));
        } catch (\Exception $e) {
            \Log::error('OTP Email failed: ' . $e->getMessage());
        }

        if (!empty($user->phone)) {
            try {
                \App\Services\SmsService::send($user->phone, "Your Snad Kitchen key is {$otp}. Valid for 15 minutes.");
            } catch (\Exception $e) {
                \Log::error('OTP SMS failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Registration successful. Please verify your email.',
            'require_verification' => true,
            'email' => $user->email
        ], 201);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified'], 400);
        }

        if ($user->otp !== $request->otp || now()->greaterThan($user->otp_expires_at)) {
            throw ValidationException::withMessages(['otp' => ['Invalid or expired OTP.']]);
        }

        $user->email_verified_at = now();
        $user->otp = null;
        $user->otp_expires_at = null;
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->role === 'customer' && is_null($user->email_verified_at)) {
            $otp = (string) rand(100000, 999999);
            $user->otp = $otp;
            $user->otp_expires_at = now()->addMinutes(15);
            $user->save();

            try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otp));
            } catch (\Exception $e) {
                \Log::error('OTP Email failed: ' . $e->getMessage());
            }

            if (!empty($user->phone)) {
                try {
                    \App\Services\SmsService::send($user->phone, "Your Snad Kitchen key is {$otp}. Valid for 15 minutes.");
                } catch (\Exception $e) {
                    \Log::error('OTP SMS failed: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Please verify your email address. A new OTP has been sent.',
                'require_verification' => true,
                'email' => $user->email
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function resendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified'], 400);
        }

        $otp = (string) rand(100000, 999999);
        $user->otp = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otp));
        } catch (\Exception $e) {
            \Log::error('OTP Email failed: ' . $e->getMessage());
        }

        if (!empty($user->phone)) {
            try {
                \App\Services\SmsService::send($user->phone, "Your Snad Kitchen key is {$otp}. Valid for 15 minutes.");
            } catch (\Exception $e) {
                \Log::error('OTP SMS failed: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'A new OTP has been sent.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function storeStaff(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|in:admin,kitchen,rider',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => $request->role,
            'email_verified_at' => now(),
        ]);

        return response()->json($user, 201);
    }

    public function index(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $users = User::withCount('orders')->latest()->get();
        return response()->json($users);
    }

    public function update(Request $request, $id)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|in:admin,kitchen,rider,customer',
        ]);

        $user->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'role' => $request->role,
        ]);

        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable',
        ]);

        $user->name = $request->name;
        $user->phone = $request->phone;

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $ext;
            $targetDir = storage_path('app/public/avatars');
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0777, true);
                @chmod($targetDir, 0777);
            }
            $file->move($targetDir, $filename);
            @chmod($targetDir . '/' . $filename, 0755);
            $schemeAndHost = $request->getSchemeAndHttpHost();
            $user->avatar = $schemeAndHost . '/snad/backend/public/storage/avatars/' . $filename;
        } elseif ($request->filled('avatar_base64') || (is_string($request->avatar) && str_starts_with($request->avatar, 'data:image'))) {
            $base64Str = $request->input('avatar_base64') ?: $request->avatar;
            $targetDir = storage_path('app/public/avatars');
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0777, true);
                @chmod($targetDir, 0777);
            }
            $dataParts = explode(',', $base64Str);
            if (count($dataParts) === 2) {
                $decodedData = base64_decode($dataParts[1]);
                $filename = 'avatar_' . $user->id . '_' . time() . '.jpg';
                file_put_contents($targetDir . '/' . $filename, $decodedData);
                @chmod($targetDir . '/' . $filename, 0755);
                $schemeAndHost = $request->getSchemeAndHttpHost();
                $user->avatar = $schemeAndHost . '/snad/backend/public/storage/avatars/' . $filename;
            }
        } elseif (is_string($request->avatar) && filter_var($request->avatar, FILTER_VALIDATE_URL)) {
            $user->avatar = $request->avatar;
        } elseif ($request->has('avatar') && ($request->avatar === '' || $request->avatar === null)) {
            $user->avatar = null;
        }

        $user->save();

        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'If an account exists with this email, a reset code has been sent.']);
        }

        $otp = (string) rand(100000, 999999);
        $user->otp = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otp));
        } catch (\Exception $e) {
            \Log::error('Password reset OTP Email failed: ' . $e->getMessage());
        }

        if (!empty($user->phone)) {
            try {
                \App\Services\SmsService::send($user->phone, "Your Snad Kitchen password key is {$otp}. Valid for 15 minutes.");
            } catch (\Exception $e) {
                \Log::error('Password reset SMS failed: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'If an account exists with this email, a reset code has been sent.']);
    }

    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if ($user->otp !== $request->otp || now()->greaterThan($user->otp_expires_at)) {
            throw ValidationException::withMessages(['otp' => ['Invalid or expired reset code.']]);
        }

        return response()->json(['message' => 'Reset code verified successfully.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if ($user->otp !== $request->otp || now()->greaterThan($user->otp_expires_at)) {
            throw ValidationException::withMessages(['otp' => ['Invalid or expired reset code.']]);
        }

        $user->password = Hash::make($request->password);
        $user->otp = null;
        $user->otp_expires_at = null;
        $user->save();

        return response()->json(['message' => 'Password reset successful. You can now login.']);
    }
}
