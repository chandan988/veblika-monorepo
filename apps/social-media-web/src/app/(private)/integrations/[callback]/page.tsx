"use client";
import api from "@/utils/api";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";

const Auth = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const appname = searchParams.get("appname");
  const isApiCalled = useRef(false);

  useEffect(() => {
    if (code && !isApiCalled.current) {
      isApiCalled.current = true; // Mark API call as made
      console.log("Code received:", code);

      api
        .post("instagram/login", { code, appname })
        .then((response: any) => {
          console.log("Access token received:", response.data);
          toast.success("Successfully connected");
        })
        .catch((error: any) => {
          toast.error("Failed to connect");
          console.error("Error exchanging code for access token:", error);
        });
    }
    console.log("Code:", code);
  }, [code]);

  return (
    <Suspense>
      <div>Auth of instagram</div>
    </Suspense>
  );
};

export default Auth;
