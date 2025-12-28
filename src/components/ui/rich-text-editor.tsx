"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string, textLength?: number) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  readOnly?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  className,
  maxLength,
  readOnly = false,
}: RichTextEditorProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleImageUpload = async (file: File): Promise<string> => {
    const filename = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("task-attachments")
      .upload(filename, file);

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("task-attachments")
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px]",
          readOnly && "pointer-events-none opacity-70",
          className
        ),
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            handleImageUpload(file).then((url) => {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      // Truncate content if it exceeds maxLength
      if (maxLength && text.length > maxLength) {
        const truncated = text.slice(0, maxLength);
        editor.commands.setContent(truncated, { emitUpdate: false });
        onChange(editor.getHTML(), maxLength);
        return;
      }

      onChange(html, text.length);
    },
  });

  return (
    <div className="border border-input rounded-md p-3">
      <EditorContent editor={editor} />
    </div>
  );
}
