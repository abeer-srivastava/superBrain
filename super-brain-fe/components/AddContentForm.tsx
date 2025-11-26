"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface AddContentFormProps {
  onAdd: (title: string, link: string, type: string) => Promise<{ success: boolean; error?: string }>;
}

export function AddContentForm({ onAdd }: AddContentFormProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !link.trim() || !type.trim()) {
      setError("All fields are required");
      return;
    }

    setIsSubmitting(true);
    const result = await onAdd(title, link, type);
    setIsSubmitting(false);

    if (result.success) {
      setTitle("");
      setLink("");
      setType("");
    } else {
      setError(result.error || "Failed to add content");
    }
  };

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
              <label htmlFor="link" className="block text-sm font-heading font-bold mb-2">
                Link
              </label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-heading font-bold mb-2">
                Type
              </label>
              <Input
                id="type"
                type="text"
                placeholder="e.g., Article, Video, Tweet"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

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
              {isSubmitting ? "Adding..." : "Add Content"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
