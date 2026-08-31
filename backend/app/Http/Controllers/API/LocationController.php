<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    // Public endpoint for active locations (checkout page)
    public function index()
    {
        return response()->json(Location::where('is_active', true)->orderBy('name')->get());
    }

    // Admin endpoint for managing all locations
    public function adminIndex()
    {
        return response()->json(Location::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:locations,name',
            'delivery_fee' => 'required|numeric|min:0',
        ]);

        $location = Location::create([
            'name' => trim($request->name),
            'delivery_fee' => $request->delivery_fee,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($location, 201);
    }

    public function update(Request $request, Location $location)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:locations,name,' . $location->id,
            'delivery_fee' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $location->update([
            'name' => trim($request->name),
            'delivery_fee' => $request->delivery_fee,
            'is_active' => $request->is_active ?? $location->is_active,
        ]);

        return response()->json($location);
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return response()->json(['message' => 'Location deleted successfully']);
    }
}
