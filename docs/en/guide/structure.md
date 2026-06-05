# Project Structure

The main structure of the documentation project is shown below:

```text
docs/
  .vitepress/    # VitePress configuration
  guide/         # Guide documents
  index.md       # Homepage
```

## Notes

- `.vitepress/config.mjs` is used to configure the top navigation and sidebars.
- Each `.md` file inside `guide/` becomes a page in the sidebar.
- As long as a page is referenced in the sidebar and the file exists, it will display normally.
