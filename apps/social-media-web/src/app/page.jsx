"use client";

import { authClient } from "@/lib/auth.client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function Home() {
  const session = authClient.useSession();
  const { userId, token, user, isAuthenticated } = useAuthSession();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn:async()=>{
      return await authClient.signOut();
    },
    onSuccess:(data)=>{
      router.push("/login")
    }
  })

  const handleLogout = async () => {
    mutation.mutate()
  };

  return (
    <div>
      {session && (
        <>
          <pre>{JSON.stringify(session, null, 2)}</pre>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Using useAuthSession hook:</h3>
            <p><strong>UserId:</strong> {userId || "Not available"}</p>
            <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : "Not available"}</p>
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}</p>
            <p><strong>User Email:</strong> {user?.email || "Not available"}</p>
            <p><strong>User Name:</strong> {user?.name || "Not available"}</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>✅ Token and userId are automatically sent in all API requests</p>
              <p>✅ Use this hook anywhere you need userId or token</p>
            </div>
          </div>
          <button className="bg-amber-300 p-4 rounded cursor-pointer mt-4" onClick={handleLogout}>
            {mutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </>
      )}
    </div>
  );
}

// import React from 'react'
// import Navbar from '@/components/homePage/navbar.jsx'
// import Container from '@/components/homePage/container.tsx'
// import HeroSection from '@/components/homePage/heroSection.tsx'
// import Image from 'next/image'
// import Feature from '@/components/homePage/feature.tsx'
// import Testimonial from '@/components/homePage/testimonial.tsx'
// import Footer from '@/components/homePage/footer.tsx'
// import CallToAction from '@/components/homePage/callToAction.tsx'
// const Home = () => {
//   return (
//     <>
      
//       <HeroSection />
//       <Feature />
//       <Testimonial />
//       {/* <CallToAction /> */}
//       <Footer />
     

//     </>
   
//   )
// }

// export default Home