// import Editor from '@toast-ui/editor'
// import 'codemirror/lib/codemirror.css'
// import '@toast-ui/editor/dist/toastui-editor.css'
const Editor = toastui.Editor

class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const editorContainer = document.createElement('div');
    this.shadowRoot.appendChild(editorContainer);
    this.editor = new Editor({
      el: editorContainer,
      previewStyle: 'vertical',
      height: '500px',
      initialValue: 'Hello, World!',
      theme: 'dark'
    });
  }

  connectedCallback() {
    this.innerHTML += `<button id="saveBtn">Save</button><button id="resetBtn">Reset</button>`;
    this.querySelector('#saveBtn').addEventListener('click', () => this.saveContent());
    this.querySelector('#resetBtn').addEventListener('click', () => this.editor.setMarkdown(''));

    window.addEventListener('nodeSelected', event => {
      const { node } = event.detail
      this.showBio({ node })
    })
  }

  async showBio({ node }) {
    if (!node || node.md === false) return;
    try {
      const markdown = await this.fetchContent(node)
      this.editor.setMarkdown(markdown)
    } catch (error) {
      console.error('Error loading content:', error);
    }
  }

  async fetchContent (node) {
    if (node.md === false) return ''
    try {
      const response = await fetch(`./brain/${node.id}/Notes.md`)
      const text = await response.text()
      return text
    } catch (error) {
      console.error('Error loading JSON:', error)
      return ''
    }
  }


  async saveContent() {
    const response = await fetch('http://localhost:3000/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: this.editor.getMarkdown(), uuid: 'your-uuid' })
    });
    if (!response.ok) throw new Error('Network response was not ok.');
    console.log('Saved Successfully:', await response.json());
  }
}

customElements.define('markdown-editor', MarkdownEditor);
