import { BrandHealth } from "@/components/dashboard/brandhealth";
import React from "react";
import { Progress } from "@/components/ui/progress";
import Premium from "@/components/dashboard/premium";
import RecentActivities from "@/components/dashboard/recent-activities";
import RecentPosts from "@/components/dashboard/recent-posts";

function Index() {
  return (
    <div className="space-y-6 bg-[#f2f3f7] px-3">
      <div className="mx-auto max-w-7xl py-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <BrandHealth />
            <RecentPosts />
          </div>

          <div className="md:col-span-1 space-y-4">
            <Premium />
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
