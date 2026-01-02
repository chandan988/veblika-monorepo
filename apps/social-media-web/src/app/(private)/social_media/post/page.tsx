"use client";
import { CreatePostForm } from "@/components/social_media/posts/create-post-form";
import { InstagramPreview } from "@/components/social_media/posts/instagram-preview";
import useGetConnectedAccounts from "@/lib/queries/appconfig/use-get-connected-accounts";
import { Spinner } from "@/components/ui/spinner";

export default function PostsPage() {
  const { data: connectedAccountsData, isLoading: isLoadingAccounts } = useGetConnectedAccounts();
  const connectedAccounts = connectedAccountsData?.data || {};

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Posts
          </h1>
          <p className="text-gray-600 mt-1 text-base">Create and Manage your posts</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create Post Form */}
          <div className="[&>div]:border-blue-200">
            <CreatePostForm connectedAccounts={connectedAccounts} />
          </div>

          {/* Instagram Preview */}
          <div className="[&>div]:border-blue-200">
            <InstagramPreview />
          </div>
        </div>
      </section>
    </main>
  );
}
