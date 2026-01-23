DEADMAN-SWITCH GALLERY (GitHub Pages)
====================================

WHAT THIS IS
------------
This repo is a self-updating gallery website hosted on GitHub Pages.
It automatically loads your images/videos from the /images folder and
shows them in a searchable gallery grid.

You do NOT manually list each image in the HTML.
You only upload files to /images and update ONE number in app.js.


CONTROLS (Viewer / Lightbox)
----------------------------
When you click a gallery tile, the viewer opens:

- Esc            = Close viewer
- Left Arrow     = Previous item
- Right Arrow    = Next item
- Up Arrow       = Scroll up inside viewer
- Down Arrow     = Scroll down inside viewer
- Shift + Up/Down= Faster scrolling
- F              = Toggle FIT <-> FULL-SIZE
- Click image    = Toggle FIT <-> FULL-SIZE

FIT mode: scales the image to fit the screen
FULL-SIZE mode: shows native pixels (scroll if needed)


WHY THIS IS USEFUL
------------------
- Upload-and-go workflow (no editing HTML to add images)
- Search bar makes big galleries easy to use
- Supports animated formats and videos
- One number controls how many files get scanned


HOW THE AUTO-LOADING WORKS (IMPORTANT)
--------------------------------------
Your HTML DOES NOT contain a list of images.

Instead, app.js generates filenames automatically using this pattern:

  PREFIX (NUMBER).EXT

Example files:

  images/100 (1).png
  images/100 (2).jpg
  images/100 (3).gif
  images/100 (4).mp4

In app.js you set:

  const PREFIX = "100";
  const MAX = 44;

That tells the code:

  "Try 100 (1) through 100 (44)"

For each number, it tries common extensions like:
png, jpg, jpeg, gif, webp, avif, svg, bmp, mp4, webm, ogv

It checks what exists and builds the gallery automatically.


ADDING MORE FILES LATER
-----------------------
If you add more files later, you ONLY change MAX inside app.js.

Example:
If your newest file becomes:

  images/100 (59).png

Then change this in app.js:

  const MAX = 59;

That’s it. Nothing else changes.
You do NOT edit HTML.


FOLDER STRUCTURE
----------------
Your repo should look like this:

  /deadman-switch
    index.html
    styles.css
    app.js
    /images
      100 (1).png
      100 (2).png
      ...


TURN ON GITHUB PAGES
--------------------
1) Go to repo Settings
2) Click Pages
3) Source:
   - Branch: main
   - Folder: /root
4) Save

Your site will be:

  https://YOURUSERNAME.github.io/deadman-switch/


NOTES
-----
- Works best if you keep media files reasonably sized.
- WebP is recommended for compression + quality.
- You can scale this gallery up to hundreds of files comfortably.

Enjoy the vault.
