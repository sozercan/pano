#!/bin/bash
# Generate Tauri app icons from the source SVG
# Requires: imagemagick (convert command) and optipng (optional)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ICONS_DIR="$SCRIPT_DIR/../src-tauri/icons"
SOURCE_SVG="$PROJECT_ROOT/public/favicon.svg"

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

echo "Generating icons from $SOURCE_SVG..."

# Check if convert (ImageMagick) is available
if ! command -v convert &> /dev/null; then
    echo "Warning: ImageMagick not found. Using fallback icon generation."
    # Create a simple fallback - copy SVG as icon.png (won't work perfectly but won't break build)
    if command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONS_DIR/icon.png"
        rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONS_DIR/32x32.png"
        rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$ICONS_DIR/128x128.png"
        rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONS_DIR/128x128@2x.png"
    else
        echo "Error: Neither ImageMagick nor rsvg-convert found. Please install one of them."
        exit 1
    fi
else
    # Generate PNG icons at various sizes
    convert -background none "$SOURCE_SVG" -resize 32x32 "$ICONS_DIR/32x32.png"
    convert -background none "$SOURCE_SVG" -resize 128x128 "$ICONS_DIR/128x128.png"
    convert -background none "$SOURCE_SVG" -resize 256x256 "$ICONS_DIR/128x128@2x.png"
    convert -background none "$SOURCE_SVG" -resize 512x512 "$ICONS_DIR/icon.png"

    # Generate ICO for Windows (contains multiple sizes)
    convert -background none "$SOURCE_SVG" -define icon:auto-resize=256,128,64,48,32,16 "$ICONS_DIR/icon.ico"

    # Generate ICNS for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Create iconset directory
        ICONSET_DIR="$ICONS_DIR/icon.iconset"
        mkdir -p "$ICONSET_DIR"

        convert -background none "$SOURCE_SVG" -resize 16x16 "$ICONSET_DIR/icon_16x16.png"
        convert -background none "$SOURCE_SVG" -resize 32x32 "$ICONSET_DIR/icon_16x16@2x.png"
        convert -background none "$SOURCE_SVG" -resize 32x32 "$ICONSET_DIR/icon_32x32.png"
        convert -background none "$SOURCE_SVG" -resize 64x64 "$ICONSET_DIR/icon_32x32@2x.png"
        convert -background none "$SOURCE_SVG" -resize 128x128 "$ICONSET_DIR/icon_128x128.png"
        convert -background none "$SOURCE_SVG" -resize 256x256 "$ICONSET_DIR/icon_128x128@2x.png"
        convert -background none "$SOURCE_SVG" -resize 256x256 "$ICONSET_DIR/icon_256x256.png"
        convert -background none "$SOURCE_SVG" -resize 512x512 "$ICONSET_DIR/icon_256x256@2x.png"
        convert -background none "$SOURCE_SVG" -resize 512x512 "$ICONSET_DIR/icon_512x512.png"
        convert -background none "$SOURCE_SVG" -resize 1024x1024 "$ICONSET_DIR/icon_512x512@2x.png"

        iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"
        rm -rf "$ICONSET_DIR"
    else
        # On Linux, create a placeholder icns (will be generated properly on macOS CI)
        echo "Skipping icns generation on non-macOS system"
        # Create empty placeholder to prevent build errors
        touch "$ICONS_DIR/icon.icns"
    fi
fi

echo "Icons generated successfully in $ICONS_DIR"
ls -la "$ICONS_DIR"
