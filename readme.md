<p align="center">
  <a href="/../../#readme">
    <h1>vite-plugin-import-build</h1>
  </a>
</p>

<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[What is this?](#what-is-this)
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Manual import](#manual-import)
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[What it does](#what-it-does)

## What is this?

This Vite plugin automatically loads your server build (i.e. your files at `dist/server/`).

[Vite-plugin-ssr](https://vite-plugin-ssr.com) and [Telefunc](https://telefunc.com) automatically add this plugin to your Vite app.


## Manual import

Usually this Vite plugin is able to automatically import your server build (i.e. your files at `dist/server/`) &mdash; there is nothing for you to do.

But the plugin doesn't work if you use Yarn PnP and you'll keep getting following error. The workaround is to manually import your server build.

```bash
# Yarn PnP users always get this error:
[@brillout/vite-plugin-import-build][Wrong Usage] Cannot find server build. (Re-)build your app
and try again. If you still get this error, then you may need to manually import the server build.
```

> [!WARNING]
> If you aren't using Yarn PnP and you keep getting this error, then it's a bug that should be fixed &mdash; please [open a new issue](https://github.com/brillout/vite-plugin-import-build/issues/new).

To manually import your server build:

```js
// server.js

// Load server build, see https://github.com/brillout/vite-plugin-import-build#manual-import
import './path/to/dist/server/importBuild.cjs'

// Your server code (Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

Make sure to import `dist/server/importBuild.cjs` only in production. See [Conditional manual import](https://github.com/brillout/vite-plugin-import-build/issues/6) if your production and development share the same server entry file.

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) then replace `dist/server/importBuild.cjs` with `${build.outDir}/server/importBuild.cjs`.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## What it does

> [!NOTE]
> This section is meant for library authors. As a user, you don't need to read this: if you have a problem, read this section [Manual import](#Manual-import) instead or reach out to maintainers.

`vite-plugin-import-build` does two things:
 - Generates an "import build" file at `dist/server/importBuild.cjs`.
 - Generates an "auto importer" file at `node_modules/vite-plugin-import-build/dist/autoImporter.js`.

The *import build* file (`dist/server/importBuild.cjs`) enables tools, such as Vike and Telefunc, to consolidate their entry files into a single entry file `dist/server/importBuild.cjs`. We recommend having a quick look at the content of `dist/server/importBuild.cjs`: you'll see that it essentially loads built user files living inside `dist/server/` (e.g for Telefunc transpiled `.telefunc.js` user files, and for Vike transpiled `+Page.js` user files).

The *auto importer* file (`node_modules/vite-plugin-import-build/dist/autoImporter.js`) automatically imports `dist/server/importBuild.cjs`, so that the user doesn't have to manually import `import 'dist/server/importBuild.cjs'` himself as shown in the following. That's the only purpose of the auto importer.

```js
// server/index.js (the user's server entry)

// Without the auto importer, the user would have to manually import dist/server/importBuild.cjs
// in his server entry like this:
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/importBuild.cjs')
}
```

See [How the auto importer works](https://github.com/brillout/vite-plugin-import-build/issues/4) to learn more.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>
