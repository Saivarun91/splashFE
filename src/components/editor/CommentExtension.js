import { Mark, mergeAttributes } from "@tiptap/core"

export const Comment = Mark.create({
  name: "comment",

  addAttributes() {
    return {
      id: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ]
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
