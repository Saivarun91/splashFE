"use client"

import { useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Highlight from "@tiptap/extension-highlight"
import { Mark, mergeAttributes } from "@tiptap/core"
import { v4 as uuidv4 } from "uuid"

const Comment = Mark.create({
  name: "comment",
  addAttributes() {
    return {
      id: {
        default: null,
      },
    }
  },
  parseHTML() {
    return [{ tag: "span[data-comment-id]" }]
  },
  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes }
    if (attrs.id) {
      attrs["data-comment-id"] = attrs.id
      delete attrs.id
    }
    return [
      "span",
      mergeAttributes(attrs, {
        class: "bg-yellow-200/70 rounded px-0.5",
      }),
      0,
    ]
  },
})

export default function CommentEditor() {
  const [comments, setComments] = useState([])
  const [contextMenu, setContextMenu] = useState(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Highlight,
      Comment,
    ],
    content: `<p>Write your project description here...</p>`,
  })

  const addComment = () => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from === to) return

    const id = uuidv4()

    editor
      .chain()
      .focus()
      .setMark('comment', { id })
      .run()

    setComments([
      ...comments,
      {
        id,
        text: "",
      },
    ])

    setContextMenu(null)
  }

  const handleRightClick = (event) => {
    event.preventDefault()

    const { from, to } = editor.state.selection
    if (from !== to) {
      setContextMenu({
        x: event.pageX,
        y: event.pageY,
      })
    }
  }

  const updateComment = (id, value) => {
    setComments(
      comments.map((c) =>
        c.id === id ? { ...c, text: value } : c
      )
    )
  }

  const deleteComment = (id) => {
    editor.chain().focus().unsetMark("comment").run()
    setComments(comments.filter((c) => c.id !== id))
  }

  return (
    <div className="flex gap-6">
      <div
        className="w-2/3 border rounded-lg p-4"
        onContextMenu={handleRightClick}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="w-1/3 border rounded-lg p-4 space-y-4">
        <h3 className="font-bold">Comments</h3>

        {comments.map((comment, index) => (
          <div
            key={comment.id}
            className="border p-3 rounded-lg bg-gray-50"
          >
            <p className="text-sm font-medium">
              Comment {index + 1}
            </p>
            <textarea
              className="w-full border mt-2 p-2 rounded"
              value={comment.text}
              onChange={(e) =>
                updateComment(comment.id, e.target.value)
              }
            />
            <button
              onClick={() => deleteComment(comment.id)}
              className="text-red-500 text-sm mt-2"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          className="absolute bg-white shadow-lg border rounded p-2"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <button
            onClick={addComment}
            className="text-sm hover:bg-gray-100 p-1 rounded"
          >
            Add Comment
          </button>
        </div>
      )}
    </div>
  )
}