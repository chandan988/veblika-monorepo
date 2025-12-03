"use client";
import { useState } from "react";

export default function YouTubeUploadPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadVideo = async () => {
    if (!video) {
      alert("Please select a video");
      return;
    }

    const formData = new FormData();
    formData.append("video", video);
    formData.append("title", title);
    formData.append("description", description);

    setLoading(true);

    const res = await fetch("http://localhost:8000/api/youtube/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      alert("Upload failed");
    } else {
      alert("Uploaded successfully!");
      console.log("YouTube Response:", data);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 600 }}>
      <h1>Upload Video to YouTube</h1>

      <div style={{ marginTop: 20 }}>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files?.[0] || null)}
        />
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginTop: 20, width: "100%", padding: 8 }}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ marginTop: 10, width: "100%", padding: 8 }}
      />

      <button
        onClick={uploadVideo}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "black",
          color: "white",
        }}
      >
        {loading ? "Uploading..." : "Upload Video"}
      </button>
    </div>
  );
}
