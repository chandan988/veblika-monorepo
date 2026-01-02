import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/app/models/employee";
import Organisation from "@/app/models/organisation";

// GET - Get all employees
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const isActive = searchParams.get("isActive");
        const organisationId = searchParams.get("organisationId");
        const branchId = searchParams.get("branchId");
        const departmentId = searchParams.get("departmentId");
        const designationId = searchParams.get("designationId");

        const query: any = {};

        if (search) {
            query.$or = [
                { "basicInformation.firstName": { $regex: search, $options: "i" } },
                { "basicInformation.lastName": { $regex: search, $options: "i" } },
                { "basicInformation.email": { $regex: search, $options: "i" } },
                { "basicInformation.EmployeeId": { $regex: search, $options: "i" } },
            ];
        }

        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        if (organisationId) {
            query["workInformation.organisationId"] = organisationId;
        }

        if (branchId) {
            query["workInformation.branchId"] = branchId;
        }

        if (departmentId) {
            query["workInformation.departmentId"] = departmentId;
        }

        if (designationId) {
            query["workInformation.designationId"] = designationId;
        }

        const skip = (page - 1) * limit;

        const [employees, total] = await Promise.all([
            Employee.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Employee.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: employees,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching employees:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch employees" },
            { status: 500 }
        );
    }
}

// POST - Create a new employee
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
console.log("Creating employee with data:", body);

const organisation=await Organisation.findOne({
            _id:body.workInformation.organisationId
        });
   console.log("Found organisation:", organisation);

        // Check if employee ID or email already exists
        const existingEmployee = await Employee.findOne({
            $or: [
                { "basicInformation.EmployeeId": body.basicInformation?.EmployeeId },
                { "basicInformation.email": body.basicInformation?.email },
            ],
        });

        if (existingEmployee) {
            return NextResponse.json(
                { success: false, error: "Employee ID or email already exists" },
                { status: 400 }
            );
        }

        const employee = await Employee.create({
            ...body,
          workInformation: {
            ...body.workInformation,
            organisation: organisation?.name || "",
          },
            userId: "6944ff331fa8459b5926c7c8", // Replace with session user ID when auth is implemented;
        });

        return NextResponse.json({ 
            success: true, 
            data: employee,
            message: "Employee created successfully" 
        });
    } catch (error: any) {
        console.error("Error creating employee:", error);
        
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
            { success: false, error: error.message || "Failed to create employee" },
            { status: 500 }
        );
    }
}
