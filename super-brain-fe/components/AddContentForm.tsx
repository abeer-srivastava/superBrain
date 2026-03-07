"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Link as LinkIcon, FileText, Image as ImageIcon, Upload, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddContentFormProps {
  onAdd: (title: string, link: string, type: string, extractedText?: string, file?: File) => Promise<{ success: boolean; error?: string }>;
}

export function AddContentForm({ onAdd }: AddContentFormProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [type, setType] = useState("link");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup preview URL on unmount or file change
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLink(""); // Clear link if file is selected
      
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !type.trim()) {
      setError("Title is required");
      return;
    }

    if (type !== 'note' && !link.trim() && !file) {
      setError("Link/URL or File is required for this type");
      return;
    }

    if (type === 'note' && !noteContent.trim()) {
      setError("Note content is required");
      return;
    }

    setIsSubmitting(true);
    const result = await onAdd(title, link, type, type === 'note' ? noteContent : undefined, file || undefined);
    setIsSubmitting(false);

    if (result.success) {
      setTitle("");
      setLink("");
      setNoteContent("");
      setType("link");
      clearFile();
    } else {
      setError(result.error || "Failed to add content");
    }
  };

  const types = [
    { value: "link", label: "Link / Article", icon: LinkIcon },
    { value: "note", label: "Manual Note", icon: FileText },
    { value: "pdf", label: "PDF Document", icon: FileText },
    { value: "image", label: "Image", icon: ImageIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Add New Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-heading font-bold mb-2">
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter content title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-heading font-bold mb-2">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                      setType(e.target.value);
                      setError(null);
                      clearFile();
                  }}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-[var(--radius-base)] border-4 border-border bg-background px-3 py-2 text-sm font-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-main"
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {type === 'note' ? (
              <div>
                <label htmlFor="noteContent" className="block text-sm font-heading font-bold mb-2">
                  Note Content
                </label>
                <Textarea
                  id="noteContent"
                  placeholder="Write your note here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-[150px]"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="link" className="block text-sm font-heading font-bold mb-2">
                        Link / URL
                        </label>
                        <Input
                        id="link"
                        type="url"
                        placeholder="https://example.com"
                        value={link}
                        onChange={(e) => {
                            setLink(e.target.value);
                            if (e.target.value) clearFile();
                        }}
                        disabled={isSubmitting || !!file}
                        />
                    </div>
                    
                    {(type === 'pdf' || type === 'image') && (
                        <div className="flex-1">
                            <label className="block text-sm font-heading font-bold mb-2">
                                Or Upload File
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting || !!link}
                                    className="w-full gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {file ? "Change File" : "Choose File"}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={type === 'pdf' ? ".pdf" : "image/*"}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file && (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="icon"
                                        onClick={clearFile}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {previewUrl && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-4 border-border rounded-[var(--radius-base)] overflow-hidden bg-secondary-background"
                        >
                            <div className="p-2 border-b-4 border-border flex justify-between items-center">
                                <span className="text-sm font-heading font-bold flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview: {file?.name}
                                </span>
                            </div>
                            <div className="p-4 flex justify-center max-h-[400px] overflow-auto">
                                {file?.type.startsWith('image/') ? (
                                    <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded-[var(--radius-base)] shadow-sm" />
                                ) : (
                                    <iframe src={previewUrl} className="w-full h-[300px] border-none" />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-[var(--radius-base)] border-4 border-border bg-chart-3/20 text-chart-3 text-sm font-base font-semibold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? "Processing..." : "Add to your Brain"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
