Drop avatar images in this folder, named exactly:

  avatar-1.png
  avatar-2.png
  avatar-3.png
  avatar-4.png
  avatar-5.png
  avatar-6.png
  avatar-7.png
  avatar-8.png

Guidelines:
- PNG with transparent background
- Roughly square, ~128x128px (they get rendered at 48x48 in-game)
- Until a file exists, that avatar slot falls back to a colored square

To add more than 8, also append the filenames to AVATAR_FILES in
games/heist/avatars.ts.
