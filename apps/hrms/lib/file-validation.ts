export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
];

export function validateFile(file: {
    size: number;
    type: string;
}) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Invalid file type");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds limit (5MB)");
    }
}
