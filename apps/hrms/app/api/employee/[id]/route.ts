import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Employee from "@/app/models/employee";

// GET - Get a single employee by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employee ID" },
                { status: 400 }
            );
        }

        const employee = await Employee.findById(id);

        if (!employee) {
            return NextResponse.json(
                { success: false, error: "Employee not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employee,
        });
    } catch (error: any) {
        console.error("Error fetching employee:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch employee" },
            { status: 500 }
        );
    }
}

// PATCH - Update an employee
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employee ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if employee ID or email is being updated and if it already exists
        if (body.basicInformation?.EmployeeId || body.basicInformation?.email) {
            const existingEmployee = await Employee.findOne({
                _id: { $ne: id },
                $or: [
                    body.basicInformation?.EmployeeId ? { "basicInformation.EmployeeId": body.basicInformation.EmployeeId } : {},
                    body.basicInformation?.email ? { "basicInformation.email": body.basicInformation.email } : {},
                ].filter(obj => Object.keys(obj).length > 0),
            });

            if (existingEmployee) {
                return NextResponse.json(
                    { success: false, error: "Employee ID or email already exists" },
                    { status: 400 }
                );
            }
        }

        const employee = await Employee.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!employee) {
            return NextResponse.json(
                { success: false, error: "Employee not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employee,
            message: "Employee updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating employee:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Employee ID or email already exists" },
                { status: 400 }
            );
        }

        if (error.name === "ValidationError") {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to update employee" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an employee
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid employee ID" },
                { status: 400 }
            );
        }

        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return NextResponse.json(
                { success: false, error: "Employee not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Employee deleted successfully",
            data: employee,
        });
    } catch (error: any) {
        console.error("Error deleting employee:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete employee" },
            { status: 500 }
        );
    }
}
