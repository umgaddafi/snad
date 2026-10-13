<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Display a listing of the settings.
     */
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->map(function ($val) {
            if (is_string($val) && (str_starts_with($val, '[') || str_starts_with($val, '{'))) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $decoded;
                }
            }
            return $val;
        });

        return response()->json($settings);
    }

    /**
     * Update settings in bulk.
     */
    public function store(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->all();
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Upload an image to the uploads/landing directory on disk.
     * The file is stored in public/uploads/landing, and ONLY the relative path is returned to be stored in the database.
     */
    public function uploadImage(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,svg,gif|max:5120',
        ]);

        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension() ?: 'png';
        $filename = 'landing_' . time() . '_' . uniqid() . '.' . $extension;
        
        $uploadDir = public_path('uploads/landing');
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $file->move($uploadDir, $filename);

        $relativePath = '/uploads/landing/' . $filename;

        return response()->json([
            'path' => $relativePath,
            'message' => 'Image saved to folder successfully'
        ]);
    }
}
