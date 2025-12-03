import React from "react";
import { Progress } from "../ui/progress";

function Premium() {
  return (
    <div className="rounded-lg w-full border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Premium</div>
        </div>
        <div className="rounded-md bg-green-50 px-2 py-1 text-sm text-green-700">
          Active
        </div>
      </div>

      <div className="mt-4 rounded-md border p-4">
        <div className="text-sm font-medium">Brand</div>
        <div className="mt-2">
          <Progress value={100} className="bg-orange-100" />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          1 out of 1 used
        </div>

        <div className="my-4 h-px bg-muted/30" />

        <div className="text-sm font-medium">Social Channels</div>
        <div className="mt-2">
          <Progress value={54} className="bg-orange-100" />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          7 out of 13 used
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>356 days left</div>
        <div>Expires Sep 10, 2026</div>
      </div>

      <button className="mt-4 w-full rounded-md bg-orange-500 px-3 py-2 text-white">
        View Details
      </button>
    </div>
  );
}

export default Premium;
